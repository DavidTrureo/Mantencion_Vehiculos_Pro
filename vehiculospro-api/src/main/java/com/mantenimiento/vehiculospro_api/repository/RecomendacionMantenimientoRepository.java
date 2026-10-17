package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.RecomendacionMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecomendacionMantenimientoRepository extends JpaRepository<RecomendacionMantenimiento, Long> {
    Optional<RecomendacionMantenimiento> findByTipoIgnoreCase(String tipo);
}
