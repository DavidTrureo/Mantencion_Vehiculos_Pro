package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.UsuarioDTO;
import com.mantenimiento.vehiculospro_api.mapper.UsuarioMapper;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/registrar")
    public ResponseEntity<UsuarioDTO> registrar(@Valid @RequestBody Usuario usuario) {
        Usuario guardado = usuarioRepository.save(usuario);
        return ResponseEntity.ok(UsuarioMapper.toDTO(guardado));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioDTO> login(@Valid @RequestBody Usuario usuario) {
        Usuario encontrado = usuarioRepository.findByEmailAndPassword(
                usuario.getEmail(), usuario.getPassword()
        ).orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        return ResponseEntity.ok(UsuarioMapper.toDTO(encontrado));
    }
}