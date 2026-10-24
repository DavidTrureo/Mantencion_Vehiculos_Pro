package com.mantenimiento.vehiculospro_api.service;

import com.mantenimiento.vehiculospro_api.dto.CreateUserRequestDTO;
import com.mantenimiento.vehiculospro_api.dto.UserResponseDTO;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.UserRole;
import com.mantenimiento.vehiculospro_api.exception.BadRequestException;
import com.mantenimiento.vehiculospro_api.exception.ForbiddenException;
import com.mantenimiento.vehiculospro_api.exception.ResourceNotFoundException;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<Usuario> login(String username, String password) {
        Optional<Usuario> userOpt = usuarioRepository.findByUsernameOrEmail(username, username);

        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                if (user.getStatus() != 1) {
                    throw new ForbiddenException("El usuario está inactivo. Contacte al administrador.");
                }
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public UserResponseDTO crearUsuario(Long creatorId, CreateUserRequestDTO request) {
        Usuario creator;
        if (usuarioRepository.count() == 0) {
            creator = new Usuario();
            creator.setId(0L);
            creator.setRole(UserRole.ADMIN);
        } else {
            if (creatorId == null || creatorId <= 0L) {
                throw new ForbiddenException("Operación no autorizada: Se requiere un ID de administrador válido.");
            }
            creator = usuarioRepository.findById(creatorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario creador no encontrado"));
            if (creator.getStatus() != 1) {
                throw new ForbiddenException("El usuario creador se encuentra inactivo.");
            }
        }

        validarPermisos(creator, request.getRole());
        validarCampos(request);

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password obligatoria para la creación de un usuario");
        }

        if (usuarioRepository.findByRut(request.getRut().toUpperCase()).isPresent()) {
            throw new BadRequestException("El RUT ya está registrado.");
        }
        if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("El username ya existe");
        }
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("El email ya existe");
        }

        Usuario newUser = new Usuario();
        copiarDatos(newUser, request);

        newUser.setCreatedBy(creatorId);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setStatus(1);

        return convertirAResponseDTO(usuarioRepository.save(newUser));
    }

    public UserResponseDTO actualizarUsuario(Long editorId, Long userId, CreateUserRequestDTO request) {
        Usuario editor = usuarioRepository.findById(editorId)
                .orElseThrow(() -> new ResourceNotFoundException("Editor no encontrado"));

        Usuario targetUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario a editar no encontrado"));

        validarPermisos(editor, targetUser.getRole());
        validarCampos(request);

        usuarioRepository.findByRut(request.getRut().toUpperCase())
                .ifPresent(u -> { if(!u.getId().equals(userId)) throw new BadRequestException("El RUT ya pertenece a otro usuario."); });

        usuarioRepository.findByUsername(request.getUsername())
                .ifPresent(u -> { if(!u.getId().equals(userId)) throw new BadRequestException("Username en uso"); });

        targetUser.setRut(request.getRut().toUpperCase());
        targetUser.setFullName(request.getFullName());
        targetUser.setEmail(request.getEmail());
        targetUser.setUsername(request.getUsername());
        targetUser.setRole(request.getRole());
        targetUser.setPhoneNumber(request.getPhoneNumber());

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty() && !request.getPassword().equals("password123")) {
            targetUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        targetUser.setUpdatedBy(editorId);
        targetUser.setUpdatedAt(LocalDateTime.now());

        return convertirAResponseDTO(usuarioRepository.save(targetUser));
    }

    @Transactional
    public UserResponseDTO actualizarFotoPerfil(Long userId, String url) {
        Usuario user = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));

        user.setProfileImageUrl(url);
        user.setUpdatedAt(LocalDateTime.now());
        user.setUpdatedBy(userId); // Se actualizó a sí mismo

        return convertirAResponseDTO(usuarioRepository.save(user));
    }

    public void eliminarUsuario(Long editorId, Long userId) {
        Usuario editor = usuarioRepository.findById(editorId)
                .orElseThrow(() -> new ResourceNotFoundException("Editor no encontrado"));
        Usuario targetUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        validarPermisos(editor, targetUser.getRole());

        targetUser.setStatus(0);
        targetUser.setUpdatedBy(editorId);
        targetUser.setUpdatedAt(LocalDateTime.now());

        usuarioRepository.save(targetUser);
    }

    public UserResponseDTO cambiarEstado(Long editorId, Long userId, Integer nuevoEstado) {
        Usuario editor = usuarioRepository.findById(editorId)
                .orElseThrow(() -> new ResourceNotFoundException("Editor no encontrado"));
        Usuario targetUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        validarPermisos(editor, targetUser.getRole());

        if (nuevoEstado != 0 && nuevoEstado != 1) {
            throw new BadRequestException("El estado debe ser 1 (Activo) o 0 (Inactivo)");
        }

        targetUser.setStatus(nuevoEstado);
        targetUser.setUpdatedBy(editorId);

        return convertirAResponseDTO(usuarioRepository.save(targetUser));
    }

    public Object listarTodos() {
        List<UserResponseDTO> lista = usuarioRepository.findAll().stream()
                .map(this::convertirAResponseDTO)
                .toList();
        return validarLista(lista, "No existen usuarios registrados.");
    }

    public Object obtenerPorRol(UserRole role) {
        List<UserResponseDTO> lista = usuarioRepository.findByRole(role).stream()
                .map(this::convertirAResponseDTO)
                .toList();
        return validarLista(lista, "No existen usuarios con el rol: " + role);
    }

    private void validarPermisos(Usuario creator, UserRole targetRole) {
        if (creator.getId() != null && creator.getId() == 0L && usuarioRepository.count() == 0) {
            return;
        }
        boolean isAdmin = creator.getRole() == UserRole.ADMIN;
        boolean isMecanicoManagingConductor = creator.getRole() == UserRole.MECANICO && targetRole == UserRole.CONDUCTOR;
        if (!isAdmin && !isMecanicoManagingConductor) throw new ForbiddenException("No tienes permisos para gestionar este tipo de usuario.");
    }

    private void copiarDatos(Usuario user, CreateUserRequestDTO request) {
        user.setRut(request.getRut().toUpperCase());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());
        user.setStatus(1);
    }

    private void validarPasswordSeguro(String password) {
        if (password == null || password.trim().length() < 8) {
            throw new BadRequestException("La contraseña debe tener al menos 8 caracteres para cumplir con las políticas de seguridad.");
        }
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new BadRequestException("La contraseña debe combinar letras y números para prevenir vulnerabilidades.");
        }
        String lower = password.toLowerCase();
        if (lower.equals("12345678") || lower.equals("password") || lower.equals("admin123") || lower.equals("123456789")) {
            throw new BadRequestException("La contraseña ingresada es demasiado común. Por favor elija una más robusta.");
        }
    }

    private void validarCampos(CreateUserRequestDTO request) {
        if (request.getRut() == null || !request.getRut().matches("^[0-9]{7,8}-[0-9Kk]$")) {
            throw new BadRequestException("RUT inválido. Formato: xxxxxxxx-y (sin puntos, con guion)");
        }
        if (request.getPhoneNumber() == null || !request.getPhoneNumber().matches("^\\+56\\d{9}$")) {
            throw new BadRequestException("El teléfono debe tener el formato +56 seguido de 9 dígitos (Ej: +56912345678)");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) throw new BadRequestException("Username obligatorio");
        if (request.getEmail() == null || request.getEmail().isBlank()) throw new BadRequestException("Email obligatorio");
        if (request.getRole() == null) throw new BadRequestException("Rol obligatorio");
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            validarPasswordSeguro(request.getPassword());
        }
    }

    public UserResponseDTO obtenerPorId(Long id) {
        return convertirAResponseDTO(usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
    }

    private Object validarLista(List<?> lista, String mensaje) {
        if (lista.isEmpty()) {
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("total", 0);
            res.put("mensaje", mensaje);
            return res;
        }
        return lista;
    }

    public UserResponseDTO convertirAResponseDTO(Usuario user) {
        return new UserResponseDTO(
                user.getId(),
                user.getRut(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getStatus(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                user.getProfileImageUrl()
        );
    }
}