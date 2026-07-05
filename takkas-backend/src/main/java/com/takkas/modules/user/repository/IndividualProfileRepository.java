package com.takkas.modules.user.repository;

import com.takkas.modules.user.domain.IndividualProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface IndividualProfileRepository extends JpaRepository<IndividualProfile, UUID> {
    Optional<IndividualProfile> findByUserId(UUID userId);
}
