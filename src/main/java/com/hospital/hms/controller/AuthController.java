package com.hospital.hms.controller;

import com.hospital.hms.dto.LoginRequest;
import com.hospital.hms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    // Endpoint to handle user login requests
    @PostMapping("/login")
    public String loginUser(@RequestBody LoginRequest loginRequest) {
        // Pass the request to the service layer and return the response
        return userService.login(loginRequest);
    }
}