package com.takkas.modules.user.repository;

import com.takkas.modules.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u.id FROM User u JOIN BusinessProfile b ON b.user.id = u.id WHERE b.id = :profileId")
    UUID findUserIdByBusinessProfileId(@Param("profileId") UUID profileId);

    @Query("SELECT u.id FROM User u JOIN IndividualProfile i ON i.user.id = u.id WHERE i.id = :profileId")
    UUID findUserIdByIndividualProfileId(@Param("profileId") UUID profileId);
}
