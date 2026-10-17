package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.Incidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidenteRepository extends JpaRepository<Incidente, Long> {
    List<Incidente> findAllByOrderByTimestampDesc();
    List<Incidente> findByVehiculoIdOrderByTimestampDesc(Long vehiculoId);
}
