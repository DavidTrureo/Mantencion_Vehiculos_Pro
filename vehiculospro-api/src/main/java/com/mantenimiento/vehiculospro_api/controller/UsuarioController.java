package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.CreateUserRequestDTO;
import com.mantenimiento.vehiculospro_api.dto.UserResponseDTO;
import com.mantenimiento.vehiculospro_api.model.UserRole;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.service.UsuarioService;
import com.mantenimiento.vehiculospro_api.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<UserResponseDTO> crearUsuario(
            @RequestParam(required = false) Long creatorId,
            @RequestBody CreateUserRequestDTO request) {
        Long finalCreatorId = creatorId != null ? creatorId : 0L;
        return new ResponseEntity<>(usuarioService.crearUsuario(finalCreatorId, request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> actualizarUsuario(
            @PathVariable Long id,
            @RequestParam(required = false) Long editorId,
            @RequestBody CreateUserRequestDTO request) {
        Long finalEditorId = (editorId != null) ? editorId : id;
        return ResponseEntity.ok(usuarioService.actualizarUsuario(finalEditorId, id, request));
    }

    @PatchMapping("/{id}/profile-image")
    public ResponseEntity<UserResponseDTO> actualizarFotoPerfil(
            @PathVariable Long id,
            @RequestParam String url) {
        UserResponseDTO actualizado = usuarioService.actualizarFotoPerfil(id, url);
        return ResponseEntity.ok(actualizado);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestParam Long editorId,
            @RequestParam Integer status) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(editorId, id, status));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<UserResponseDTO> toggleStatus(
            @PathVariable Long id,
            @RequestParam Long editorId) {
        Usuario targetUser = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        Integer nuevoEstado = (targetUser.getStatus() == 1) ? 0 : 1;
        return ResponseEntity.ok(usuarioService.cambiarEstado(editorId, id, nuevoEstado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminarUsuario(
            @PathVariable Long id,
            @RequestParam Long editorId) {
        usuarioService.eliminarUsuario(editorId, id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario desactivado correctamente (status 0)"));
    }

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<?> obtenerPorRol(@PathVariable String role) {
        try {
            UserRole roleEnum = UserRole.valueOf(role.toUpperCase());
            return ResponseEntity.ok(usuarioService.obtenerPorRol(roleEnum));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    Map.of("error", "El rol '" + role + "' no es válido. Use ADMIN, MECANICO o CONDUCTOR."),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @PutMapping("/{id}/fcm-token")
    public ResponseEntity<?> actualizarFcmToken(
            @PathVariable Long id,
            @RequestParam String token) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        usuario.setFcmToken(token);
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("message", "Token FCM actualizado correctamente"));
    }
}