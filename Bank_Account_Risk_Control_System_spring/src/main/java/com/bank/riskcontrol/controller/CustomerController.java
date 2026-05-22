package com.bank.riskcontrol.controller;

import com.bank.riskcontrol.common.ApiResponse;
import com.bank.riskcontrol.dto.CustomerCreateRequest;
import com.bank.riskcontrol.dto.CustomerResponse;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@Tag(name = "客户管理")
public class CustomerController {
    private final CustomerService customerService;

    @PostMapping
    @Operation(summary = "创建客户")
    public ApiResponse<CustomerResponse> createCustomer(
            @RequestBody @Valid CustomerCreateRequest request) throws BusinessException {
        return ApiResponse.success(customerService.createCustomer(request));
    }
}
