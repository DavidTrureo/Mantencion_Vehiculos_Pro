package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.DocumentoVehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentoVehiculoRepository extends JpaRepository<DocumentoVehiculo, Long> {
    List<DocumentoVehiculo> findByVehiculoId(Long vehiculoId);
    List<DocumentoVehiculo> findByVehiculoIdAndVigenteTrue(Long vehiculoId);
}
