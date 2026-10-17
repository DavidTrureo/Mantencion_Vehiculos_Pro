package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.AuthRequestDTO;
import com.mantenimiento.vehiculospro_api.dto.AuthResponseDTO;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.service.UsuarioService;
import com.mantenimiento.vehiculospro_api.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "VehiculosPro API",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody AuthRequestDTO request) {
        Optional<Usuario> user = usuarioService.login(request.getUsername(), request.getPassword());

        if (user.isPresent()) {
            Usuario u = user.get();
            String token = jwtUtil.generateToken(u.getUsername());
            return ResponseEntity.ok(
                    new AuthResponseDTO(
                            "Login exitoso",
                            true,
                            u.getId(),
                            u.getUsername(),
                            u.getRole() != null ? u.getRole().name() : null,
                            token,
                            u.getFullName(),
                            u.getEmail()
                    )
            );
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new AuthResponseDTO(
                        "Credenciales inválidas",
                        false,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                )
        );
    }

    @PostMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestBody Map<String, String> requestBody) {
        String identifier = requestBody.get("username");
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("exists", false));
        }
        boolean exists = usuarioRepository.findByUsernameOrEmail(identifier, identifier).isPresent();
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
