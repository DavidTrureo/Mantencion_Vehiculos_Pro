package com.mantenimiento.vehiculospro_api.dto;

import com.mantenimiento.vehiculospro_api.model.UserRole;

public class CreateUserRequestDTO {
    private String rut;
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phoneNumber;
    private UserRole role;
    private String profileImageUrl;

    public CreateUserRequestDTO() {}

    public CreateUserRequestDTO(String rut, String username, String email, String password, String fullName, String phoneNumber, UserRole role, String profileImageUrl) {
        this.rut = rut;
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
    }

    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}
