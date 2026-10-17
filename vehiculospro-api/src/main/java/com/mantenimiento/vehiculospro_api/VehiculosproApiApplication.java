package com.mantenimiento.vehiculospro_api;

import com.mantenimiento.vehiculospro_api.model.RecomendacionMantenimiento;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.UserRole;
import com.mantenimiento.vehiculospro_api.repository.RecomendacionMantenimientoRepository;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Arrays;

@SpringBootApplication
public class VehiculosproApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehiculosproApiApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            RecomendacionMantenimientoRepository repository,
            UsuarioRepository usuarioRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate
    ) {
        return args -> {
            try {
                try {
                    jdbcTemplate.execute("ALTER TABLE usuarios ALTER COLUMN role TYPE VARCHAR(50)");
                } catch (Exception ex) {
                    jdbcTemplate.execute("ALTER TABLE usuarios MODIFY COLUMN role VARCHAR(50)");
                }
                jdbcTemplate.execute("UPDATE usuarios SET role = 'CONDUCTOR' WHERE role = 'GUARD'");
                jdbcTemplate.execute("UPDATE usuarios SET role = 'MECANICO' WHERE role = 'SUPERVISOR'");
            } catch (Exception e) {
                // Roles ya actualizados o columna en formato correcto
            }


            if (repository.count() == 0) {
                repository.saveAll(Arrays.asList(
                    new RecomendacionMantenimiento("Cambio de aceite", 5000, 10000, "Recomendado para proteger el motor de fricciones y mantener la lubricación óptima."),
                    new RecomendacionMantenimiento("Revisión de frenos", 10000, 20000, "Es vital revisar el desgaste de las pastillas y el líquido de frenos por seguridad."),
                    new RecomendacionMantenimiento("Cambio de batería", 40000, 60000, "Evita quedarte sin energía. Las baterías suelen durar de 2 a 4 años."),
                    new RecomendacionMantenimiento("Revisión de neumáticos", 8000, 10000, "Realiza alineación, balanceo y rotación para evitar desgaste irregular."),
                    new RecomendacionMantenimiento("Cambio de bujías", 20000, 40000, "Mejora la combustión y reduce el consumo de combustible."),
                    new RecomendacionMantenimiento("Revisión de suspensión", 20000, 30000, "Revisa amortiguadores y bujes para garantizar estabilidad."),
                    new RecomendacionMantenimiento("Cambio de filtro de aire", 10000, 15000, "Permite que el motor respire aire limpio y consuma menos combustible."),
                    new RecomendacionMantenimiento("Limpieza de inyectores", 20000, 30000, "Optimiza la inyección de combustible y mejora la respuesta del motor.")
                ));
            }

            if (usuarioRepository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@vehiculospro.com");
                admin.setFullName("Administrador Inicial");
                admin.setRole(UserRole.ADMIN);
                admin.setStatus(1);
                admin.setRut("11111111-1");
                admin.setCreatedAt(java.time.LocalDateTime.now());
                admin.setCreatedBy(0L);
                usuarioRepository.save(admin);
                
                Usuario conductor = new Usuario();
                conductor.setUsername("conductor1");
                conductor.setPassword(passwordEncoder.encode("conductor123"));
                conductor.setEmail("conductor1@vehiculospro.com");
                conductor.setFullName("Juan Conductor");
                conductor.setRole(UserRole.CONDUCTOR);
                conductor.setStatus(1);
                conductor.setRut("22222222-2");
                conductor.setCreatedAt(java.time.LocalDateTime.now());
                conductor.setCreatedBy(0L);
                usuarioRepository.save(conductor);
            }
        };
    }
}