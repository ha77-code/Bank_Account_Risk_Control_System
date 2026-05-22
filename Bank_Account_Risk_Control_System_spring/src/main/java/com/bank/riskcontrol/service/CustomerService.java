package com.bank.riskcontrol.service;

import com.bank.riskcontrol.dto.CustomerCreateRequest;
import com.bank.riskcontrol.dto.CustomerResponse;
import com.bank.riskcontrol.entity.Customer;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class CustomerService {
    private final CustomerRepository customerRepository;

    public CustomerResponse createCustomer(CustomerCreateRequest request) throws BusinessException {
        // 检查身份证是否已注册
        if (customerRepository.existsByIdCardNo(request.getIdCardNo())) {
            throw new BusinessException(400, "该身份证号已注册");
        }

        Customer customer = Customer.builder()
                .name(request.getName())
                .idCardNo(request.getIdCardNo())
                .phone(request.getPhone())
                .build();

        Customer saved = customerRepository.save(customer);

        return CustomerResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .idCardNo(saved.getIdCardNo())
                .phone(saved.getPhone())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
