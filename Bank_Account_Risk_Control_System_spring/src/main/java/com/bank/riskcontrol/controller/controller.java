package com.bank.riskcontrol.controller;

import com.bank.riskcontrol.common.ApiResponse;
import com.bank.riskcontrol.dto.TransactionResponse;
import com.bank.riskcontrol.dto.TransactionService;
import com.bank.riskcontrol.dto.TransferRequest;
import com.bank.riskcontrol.exception.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transaction")
@RequiredArgsConstructor
@Tag(name = "交易管理")
public class controller {
    private final TransactionService transactionService;

    @PostMapping("/transfer")
    @Operation(summary = "发起转账")
    public ApiResponse<TransactionResponse> transfer(
            @RequestBody @Valid TransferRequest request
            ) throws BusinessException {
        return ApiResponse.success(transactionService.transfer((request)));
    }

    @Operation(summary = "查询交易流水")
    public ApiResponse<List<TransactionResponse>> getTransactions(
            @RequestParam String accountNo) {
        return ApiResponse.success(transactionService.getTransactions(accountNo));
    }

    @GetMapping("/risk-blocked")
    @Operation(summary = "查询风控拦截记录")
    public ApiResponse<List<TransactionResponse>> getRiskBlocked() {
        return ApiResponse.success(transactionService.getRiskBlockedTransactions());
    }
}
