/**
 * WebFOCUS REST API クライアント
 * 認証、レポート取得、実行などの機能を提供
 */

const BASE_URL = '/ibi_apps/rs';

const ACTION_METHODS = {
  signOn: 'GET',
  signOff: 'GET',
  get: 'GET',
  describeFex: 'GET',
  run: 'GET'
};

function getActionMethod(action) {
  return ACTION_METHODS[action] || 'GET';
}

function buildActionParams(action, extraParams = {}) {
  const params = new URLSearchParams();
  params.append('IBIRS_action', action);

  if (!Object.prototype.hasOwnProperty.call(extraParams, 'IBIRS_service')) {
    params.append('IBIRS_service', 'ibfs');
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  return params;
}

function buildRequest(action, extraParams, options = {}) {
  const method = getActionMethod(action);
  const params = buildActionParams(action, extraParams);
  const headers = options.headers ? { ...options.headers } : {};

  if (method === 'POST') {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    return {
      url: BASE_URL,
      options: {
        method: 'POST',
        credentials: 'include',
        headers,
        body: params.toString()
      }
    };
  }

  return {
    url: `${BASE_URL}?${params.toString()}`,
    options: {
      method: 'GET',
      credentials: 'include',
      headers
    }
  };
}

/**
 * XMLレスポンスを解析してPOJOに変換
 */
function parseXMLResponse(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  return xmlDoc;
}

/**
 * サインオン（ログイン）
 * @param {string} username - ユーザー名
 * @param {string} password - パスワード
 * @returns {Promise<{success: boolean, user: string, tokens: object}>}
 */
export async function signOn(username, password) {
  try {
    const request = buildRequest(
      'signOn',
      {
        IBIRS_userName: username,
        IBIRS_password: password
      },
      {
        headers: {
          'Accept': 'application/xml'
        }
      }
    );

    const response = await fetch(request.url, request.options);

    const xmlText = await response.text();
    const xmlDoc = parseXMLResponse(xmlText);
    
    const rootElement = xmlDoc.documentElement;
    const returncode = rootElement.getAttribute('returncode');
    const returndesc = rootElement.getAttribute('returndesc');

    if (returncode === '10000' || returncode === '0') {
      // CSRF トークンを取得
      let csrfTokenName = '';
      let csrfTokenValue = '';
      
      const entries = xmlDoc.querySelectorAll('entry');
      entries.forEach(entry => {
        const key = entry.querySelector('key')?.getAttribute('value');
        const value = entry.querySelector('value')?.getAttribute('value');
        
        if (key === 'IBI_CSRF_Token_Name') {
          csrfTokenName = value;
        } else if (key === 'IBI_CSRF_Token_Value') {
          csrfTokenValue = value;
        }
      });

      return {
        success: true,
        user: username,
        tokens: {
          csrfTokenName,
          csrfTokenValue
        }
      };
    } else {
      return {
        success: false,
        error: returndesc || 'ログイン失敗'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * サインオフ（ログアウト）
 */
export async function signOff() {
  try {
    const request = buildRequest('signOff');
    await fetch(request.url, request.options);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * フォルダ/ファイル一覧を取得
 * @param {string} path - IBFS パス (例: IBFS:/WFC/Repository/reports)
 * @returns {Promise<{success: boolean, items: Array}>}
 */
export async function getContents(path) {
  try {
    const request = buildRequest(
      'get',
      {
        IBIRS_path: path
      },
      {
        headers: {
          'Accept': 'application/xml'
        }
      }
    );

    const response = await fetch(request.url, request.options);

    const xmlText = await response.text();
    const xmlDoc = parseXMLResponse(xmlText);
    
    const returncode = xmlDoc.documentElement.getAttribute('returncode');
    if (returncode !== '10000' && returncode !== '0') {
      return {
        success: false,
        error: xmlDoc.documentElement.getAttribute('returndesc')
      };
    }

    // <ibfsobject> タグから子要素を取得
    const items = [];
    const container = xmlDoc.querySelector('ibfsobject') || xmlDoc.querySelector('rootObject');
    
    if (container) {
      const children = container.querySelector('children');
      if (children) {
        const childItems = children.querySelectorAll('item');
        childItems.forEach(item => {
          const name = item.getAttribute('name') || '';
          const type = item.getAttribute('type');
          const objtype = item.querySelector('objtype')?.textContent || type;
          const objtypeLower = (objtype || '').toString().toLowerCase();
          const fullPath = item.getAttribute('fullPath');

          items.push({
            name,
            type: objtype,
            path: fullPath || `${path}/${name}`,
            isFolder: objtypeLower === 'folder' || objtypeLower === 'mrfolder',
            isFex: objtypeLower === 'fexfile' || name.toLowerCase().endsWith('.fex')
          });
        });
      }
    }

    return {
      success: true,
      items: items.sort((a, b) => {
        // フォルダを先に表示
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      })
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * レポートの定義情報を取得（describeFex）
 * @param {string} path - Fexファイルパス
 * @returns {Promise<{success: boolean, params: Array}>}
 */
export async function describeFex(path) {
  try {
    const request = buildRequest(
      'describeFex',
      {
        IBIRS_path: path
      },
      {
        headers: {
          'Accept': 'application/xml'
        }
      }
    );

    const response = await fetch(request.url, request.options);

    const xmlText = await response.text();
    const xmlDoc = parseXMLResponse(xmlText);
    
    const returncode = xmlDoc.documentElement.getAttribute('returncode');
    if (returncode !== '10000' && returncode !== '0') {
      return {
        success: false,
        error: xmlDoc.documentElement.getAttribute('returndesc')
      };
    }

    // パラメータを抽出
    const parameters = [];
    const amperMap = xmlDoc.querySelector('amperMap');
    
    if (amperMap) {
      const entries = amperMap.querySelectorAll('entry');
      entries.forEach(entry => {
        const paramType = entry.getAttribute('type');
        
        // "unresolved" のみを対象
        if (paramType === 'unresolved') {
          const key = entry.querySelector('key')?.getAttribute('value');
          const valuesElement = entry.querySelector('values');
          
          if (key && valuesElement) {
            const valueEntries = valuesElement.querySelectorAll('entry');
            const options = [];
            
            valueEntries.forEach(ve => {
              const optionKey = ve.querySelector('key')?.getAttribute('value');
              const optionValue = ve.querySelector('value')?.getAttribute('value');
              
              if (optionKey && optionValue) {
                options.push({
                  label: optionKey,
                  value: optionValue
                });
              }
            });

            parameters.push({
              name: key,
              type: options.length > 0 ? 'select' : 'text',
              options: options
            });
          }
        }
      });
    }

    return {
      success: true,
      params: parameters
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * レポートを通常実行
 * @param {string} path - Fexファイルパス
 * @returns {Promise<{success: boolean, result: string}>}
 */
export async function runReport(path) {
  try {
    const request = buildRequest('run', {
      IBIRS_path: path
    });

    const response = await fetch(request.url, request.options);

    // HTML/PDF/などの出力を返す
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      return {
        success: true,
        result: html,
        contentType: 'html'
      };
    } else if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      return {
        success: true,
        result: URL.createObjectURL(blob),
        contentType: 'pdf'
      };
    } else {
      const text = await response.text();
      return {
        success: true,
        result: text,
        contentType: 'text'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * パラメータ付きでレポートを実行
 * @param {string} path - Fexファイルパス
 * @param {object} parameterValues - パラメータ値 {paramName: value}
 * @returns {Promise<{success: boolean, result: string}>}
 */
export async function runReportWithParams(path, parameterValues) {
  try {
    const request = buildRequest(
      'run',
      {
        IBIRS_path: path,
        ...parameterValues
      }
    );

    const response = await fetch(request.url, request.options);

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      return {
        success: true,
        result: html,
        contentType: 'html'
      };
    } else if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      return {
        success: true,
        result: URL.createObjectURL(blob),
        contentType: 'pdf'
      };
    } else {
      const text = await response.text();
      return {
        success: true,
        result: text,
        contentType: 'text'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
