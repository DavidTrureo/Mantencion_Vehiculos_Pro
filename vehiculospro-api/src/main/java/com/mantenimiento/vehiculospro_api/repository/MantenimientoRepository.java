package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Long> {
    // Spring creará un método para buscar todos los mantenimientos de un vehículo
    List<Mantenimiento> findByVehiculoId(Long vehiculoId);
}