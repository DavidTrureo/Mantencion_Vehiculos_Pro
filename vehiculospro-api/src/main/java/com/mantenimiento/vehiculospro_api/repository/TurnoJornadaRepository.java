package com.mantenimiento.vehiculospro_api.repository;

import com.mantenimiento.vehiculospro_api.model.TurnoJornada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TurnoJornadaRepository extends JpaRepository<TurnoJornada, Long> {

    Optional<TurnoJornada> findFirstByVehiculoIdAndEstado(Long vehiculoId, TurnoJornada.EstadoTurno estado);

    Optional<TurnoJornada> findFirstByConductorIdAndEstado(Long conductorId, TurnoJornada.EstadoTurno estado);

    List<TurnoJornada> findByVehiculoIdOrderByFechaHoraInicioDesc(Long vehiculoId);

    List<TurnoJornada> findByConductorIdOrderByFechaHoraInicioDesc(Long conductorId);

    List<TurnoJornada> findByEstadoOrderByFechaHoraInicioDesc(TurnoJornada.EstadoTurno estado);

    List<TurnoJornada> findTop50ByOrderByFechaHoraInicioDesc();
}
