package com.hospital.hms.dto;

import lombok.Data;

@Data
public class LoginRequest {
    // Username provided by the client during login
    private String username;
    
    // Password provided by the client during login
    private String password;
}