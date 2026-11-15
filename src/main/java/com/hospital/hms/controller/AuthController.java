package com.hospital.hms.controller;

import com.hospital.hms.dto.AuthResponse;
import com.hospital.hms.dto.LoginRequest;
import com.hospital.hms.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    // Endpoint to handle user login requests
    @PostMapping("/login")
    public AuthResponse loginUser(@RequestBody LoginRequest loginRequest) {
        
        // 1. Authenticate the user using Spring Security
        // This will automatically check the encrypted password against the database
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        // 2. If authentication is successful, generate a JWT token
        if (authentication.isAuthenticated()) {
            String token = jwtService.generateToken(loginRequest.getUsername());
            return new AuthResponse(token);
        } else {
            throw new RuntimeException("Invalid credentials!");
        }
    }
}