package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    List<Vehiculo> findByPropietarioId(Long propietarioId);
}