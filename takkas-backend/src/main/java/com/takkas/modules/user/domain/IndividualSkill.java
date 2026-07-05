package com.takkas.modules.user.domain;

import com.takkas.modules.user.domain.enums.Skill;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "individual_skills",
    uniqueConstraints = @UniqueConstraint(columnNames = {"individual_id","skill"}))
@Getter @Setter @NoArgsConstructor
public class IndividualSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "individual_id", nullable = false)
    private IndividualProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Skill skill;

    public IndividualSkill(IndividualProfile profile, Skill skill) {
        this.profile = profile;
        this.skill = skill;
    }
}
