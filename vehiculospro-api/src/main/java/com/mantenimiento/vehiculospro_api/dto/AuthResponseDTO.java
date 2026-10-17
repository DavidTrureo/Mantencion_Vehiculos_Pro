package com.mantenimiento.vehiculospro_api.dto;

public class AuthResponseDTO {
    private String message;
    private boolean success;
    private Long userId;
    private String username;
    private String role;
    private String token;    // Agregado para el Frontend
    private String fullName; // Agregado para el Frontend
    private String email;    // Agregado para el Frontend

    public AuthResponseDTO() {}

    public AuthResponseDTO(String message, boolean success, Long userId, String username, String role, String token, String fullName, String email) {
        this.message = message;
        this.success = success;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.token = token;
        this.fullName = fullName;
        this.email = email;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public Long getId() { return userId; }
    public void setId(Long id) { this.userId = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
