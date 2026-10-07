export const isAuthenticated = () => true;

export const getToken = () => "dummy-token";

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});
