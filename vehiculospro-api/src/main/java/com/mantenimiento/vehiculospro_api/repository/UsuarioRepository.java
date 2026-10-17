package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByRut(String rut);
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByUsernameOrEmail(String username, String email);
    List<Usuario> findByRole(UserRole role);
    boolean existsByEmail(String email);
}