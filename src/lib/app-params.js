const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Validate JWT token format
 * @param {string} token - Token to validate
 * @returns {boolean}
 */
function isValidJWT(token) {
	if (!token || typeof token !== 'string') return false;
	const parts = token.split('.');
	return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidURL(url) {
	if (!url || typeof url !== 'string') return false;
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
function isValidUUID(uuid) {
	if (!uuid || typeof uuid !== 'string') return false;
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false, validator = null } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `kawa_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		// Validate before storing
		if (validator && !validator(searchParam)) {
			console.warn(`Invalid value for ${paramName}: ${searchParam}`);
			return defaultValue;
		}
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		// Validate stored value
		if (validator && !validator(storedValue)) {
			console.warn(`Invalid stored value for ${paramName}, clearing`);
			storage.removeItem(storageKey);
			return null;
		}
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('kawa_access_token');
		storage.removeItem('token');
	}
	
	const token = getAppParamValue("access_token", { 
		removeFromUrl: true,
		validator: isValidJWT
	});
	
	console.log('📖 getAppParams - token from storage:', token ? '✅ found' : '❌ not found');
	
	return {
		appId: getAppParamValue("app_id", { 
			defaultValue: import.meta.env.VITE_KAWA_APP_ID,
			validator: isValidUUID
		}),
		token: token,
		fromUrl: getAppParamValue("from_url", { 
			defaultValue: window.location.href,
			validator: isValidURL
		}),
		functionsVersion: getAppParamValue("functions_version", { 
			defaultValue: import.meta.env.VITE_KAWA_FUNCTIONS_VERSION 
		}),
		appBaseUrl: getAppParamValue("app_base_url", { 
			defaultValue: import.meta.env.VITE_KAWA_APP_BASE_URL,
			validator: isValidURL
		}),
	}
}

// Create a reactive proxy for appParams
export const appParams = new Proxy(getAppParams(), {
	get(target, prop) {
		// Always read fresh from storage for token
		if (prop === 'token') {
			const freshToken = storage.getItem('kawa_access_token');
			console.log('🔍 appParams.token getter - reading from storage:', freshToken ? '✅ found' : '❌ not found');
			return freshToken;
		}
		return target[prop];
	}
});

/**
 * Update the app token in runtime and persist to localStorage
 * @param {string|null} token - The access token to set, or null to clear
 */
export const setAppToken = (token) => {
	if (token) {
		// Validate token format before storing
		if (!isValidJWT(token)) {
			console.error('❌ Invalid token format');
			return;
		}
		console.log('💾 Storing token in localStorage');
		storage.setItem('kawa_access_token', token);
		console.log('✅ Token stored:', token.substring(0, 20) + '...');
	} else {
		console.log('🗑️  Clearing token');
		storage.removeItem('kawa_access_token');
	}
};
