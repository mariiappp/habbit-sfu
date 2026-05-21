import API_BASE_URL from './config';

function withToken(path, token) {
  if (!token) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}wstoken=${encodeURIComponent(token)}`;
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${withToken(path, token)}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}

export async function fetchMoodleUser(token) {
  const data = await apiRequest('/moodle/user', token, { method: 'GET' });
  if (!data) return null;
  return {
    username: data.username,
    firstname: data.firstname,
    lastname: data.lastname,
    fullname: data.fullname,
    userid: data.userid,
    siteurl: data.siteurl,
    sitename: data.sitename,
    userpictureurl: data.userpictureurl,
    lang: data.lang,
  };
}
