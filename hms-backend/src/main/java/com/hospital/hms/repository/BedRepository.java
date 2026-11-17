package com.hospital.hms.repository;

import com.hospital.hms.entity.Bed;
import com.hospital.hms.entity.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    // Retrieve all beds in a ward
    List<Bed> findByWardId(Long wardId);

    // Retrieve beds filtered by status (AVAILABLE, OCCUPIED, MAINTENANCE)
    List<Bed> findByStatus(BedStatus status);

    // Retrieve beds in a specific ward by status
    List<Bed> findByWardIdAndStatus(Long wardId, BedStatus status);

    // Count beds by status
    long countByStatus(BedStatus status);
}
