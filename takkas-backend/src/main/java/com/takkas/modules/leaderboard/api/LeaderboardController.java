package com.takkas.modules.leaderboard.api;

import com.takkas.modules.leaderboard.api.dto.LeaderboardEntryResponse;
import com.takkas.modules.leaderboard.service.LeaderboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/api/leaderboard/top-earners")
    public List<LeaderboardEntryResponse> topEarners(
        @RequestParam(defaultValue = "20") int limit
    ) {
        return leaderboardService.topEarners(limit);
    }

    @GetMapping("/api/leaderboard/top-givers")
    public List<LeaderboardEntryResponse> topGivers(
        @RequestParam(defaultValue = "20") int limit
    ) {
        return leaderboardService.topGivers(limit);
    }
}
