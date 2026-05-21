package com.apiflow.service;

import com.apiflow.model.ApiRequest;
import com.apiflow.model.ApiRequestHistory;
import com.apiflow.repository.ApiRequestRepository;
import com.apiflow.repository.ApiRequestHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiRequestHistoryService {
    
    private final ApiRequestHistoryRepository historyRepository;
    private final ApiRequestRepository apiRequestRepository;
    
    public List<ApiRequestHistory> getHistoryByRequestId(Long requestId) {
        return historyRepository.findTop50ByApiRequestIdOrderByExecutedAtDesc(requestId);
    }
    
    public Optional<ApiRequestHistory> getHistoryById(Long id) {
        return historyRepository.findById(id);
    }
    
    @Transactional
    public ApiRequestHistory saveHistory(Long requestId, ApiRequestHistory history) {
        log.info("Saving history for API Request: {}", requestId);
        
        ApiRequest apiRequest = apiRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("API Request not found: " + requestId));
        
        history.setApiRequest(apiRequest);
        history.setExecutedAt(LocalDateTime.now());
        
        return historyRepository.save(history);
    }
    
    @Transactional
    public void deleteHistory(Long historyId) {
        log.info("Deleting history: {}", historyId);
        historyRepository.deleteById(historyId);
    }
    
    @Transactional
    public void clearHistoryForRequest(Long requestId) {
        log.info("Clearing all history for API Request: {}", requestId);
        List<ApiRequestHistory> histories = historyRepository.findByApiRequestIdOrderByExecutedAtDesc(requestId);
        historyRepository.deleteAll(histories);
    }
}

// Made with Bob