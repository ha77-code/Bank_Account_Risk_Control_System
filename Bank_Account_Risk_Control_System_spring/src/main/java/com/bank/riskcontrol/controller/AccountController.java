package com.bank.riskcontrol.controller;

import com.bank.riskcontrol.common.ApiResponse;
import com.bank.riskcontrol.dto.AccountCreateRequest;
import com.bank.riskcontrol.dto.AccountResponse;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "账户管理")
public class AccountController {
    private final AccountService accountService;

    @PostMapping
    @Operation(summary = "创建账户")
    public ApiResponse<AccountResponse> createAccount(
            @RequestBody @Valid AccountCreateRequest request) throws BusinessException {
        return ApiResponse.success(accountService.createAccount(request));
    }

    @GetMapping("/{accountNo}")
    @Operation(summary = "查询账户详情")
    public ApiResponse<AccountResponse> getAccount(
            @PathVariable String accountNo) throws BusinessException {
        return ApiResponse.success(accountService.getAccount(accountNo));
    }

    @PatchMapping("/{accountNo}/freeze")
    @Operation(summary = "冻结账户")
    public ApiResponse<AccountResponse> freezeAccount(
            @PathVariable String accountNo) throws BusinessException {
        return ApiResponse.success(accountService.freezeAccount(accountNo));
    }

    @PatchMapping("/{accountNo}/unfreeze")
    @Operation(summary = "解冻账户")
    public ApiResponse<AccountResponse> unfreezeAccount(
            @PathVariable String accountNo) throws BusinessException {
        return ApiResponse.success(accountService.unfreezeAccount(accountNo));
    }
}
