package com.takkas.modules.admin.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.admin.api.dto.AdminUserSummaryResponse;
import com.takkas.modules.complaint.service.TrustMetricsService;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int MAX_RESULTS = 40;

    private final UserRepository userRepository;
    private final IndividualProfileRepository individualRepo;
    private final BusinessProfileRepository businessRepo;
    private final TrustMetricsService trustMetricsService;

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> searchUsers(String query) {
        String term = query != null ? query.trim() : "";
        LinkedHashMap<UUID, User> users = new LinkedHashMap<>();

        if (term.isEmpty()) {
            userRepository.findTop40ByOrderByCreatedAtDesc().forEach(u -> users.put(u.getId(), u));
        } else {
            userRepository.findTop40ByEmailContainingIgnoreCaseOrderByCreatedAtDesc(term)
                .forEach(u -> users.put(u.getId(), u));

            try {
                UUID id = UUID.fromString(term);
                userRepository.findById(id).ifPresent(u -> users.put(u.getId(), u));
            } catch (IllegalArgumentException ignored) {
                // arama terimi UUID değil
            }

            if (term.length() >= 2) {
                individualRepo.findTop20ByUsernameContainingIgnoreCaseOrderByUsernameAsc(term)
                    .forEach(p -> addProfileUser(users, p.getUser()));
                individualRepo.findTop20ByFullNameContainingIgnoreCaseOrderByFullNameAsc(term)
                    .forEach(p -> addProfileUser(users, p.getUser()));
                businessRepo.findTop20ByBusinessNameContainingIgnoreCaseOrderByBusinessNameAsc(term)
                    .forEach(p -> addProfileUser(users, p.getUser()));
            }
        }

        return users.values().stream()
            .limit(MAX_RESULTS)
            .map(this::toSummary)
            .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserSummaryResponse setSuspended(UUID userId, boolean suspended) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        if (user.getUserType() == UserType.ADMIN) {
            throw new BusinessRuleException("Admin hesapları askıya alınamaz.");
        }

        user.setStatus(suspended ? UserStatus.SUSPENDED : UserStatus.ACTIVE);
        userRepository.save(user);
        return toSummary(user);
    }

    private void addProfileUser(Map<UUID, User> users, User user) {
        if (user != null) {
            users.putIfAbsent(user.getId(), user);
        }
    }

    private AdminUserSummaryResponse toSummary(User user) {
        String displayName = resolveDisplayName(user);
        long completed = resolveCompletedTaskCount(user);
        return new AdminUserSummaryResponse(
            user.getId(),
            user.getEmail(),
            displayName,
            user.getUserType().name(),
            user.getStatus().name(),
            completed,
            0
        );
    }

    private String resolveDisplayName(User user) {
        return switch (user.getUserType()) {
            case INDIVIDUAL -> individualRepo.findByUserId(user.getId())
                .map(IndividualProfile::getFullName)
                .orElse(user.getEmail());
            case BUSINESS -> businessRepo.findByUserId(user.getId())
                .map(BusinessProfile::getBusinessName)
                .orElse(user.getEmail());
            case ADMIN -> "Admin";
        };
    }

    private long resolveCompletedTaskCount(User user) {
        return switch (user.getUserType()) {
            case INDIVIDUAL -> individualRepo.findByUserId(user.getId())
                .map(p -> trustMetricsService.getForIndividual(p.getId()).completedTaskCount())
                .orElse(0L);
            case BUSINESS -> businessRepo.findByUserId(user.getId())
                .map(p -> trustMetricsService.getForBusiness(p.getId()).completedTaskCount())
                .orElse(0L);
            case ADMIN -> 0L;
        };
    }
}
