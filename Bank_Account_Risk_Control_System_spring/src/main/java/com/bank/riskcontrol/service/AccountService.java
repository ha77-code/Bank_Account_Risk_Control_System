package com.bank.riskcontrol.service;

import com.bank.riskcontrol.dto.AccountCreateRequest;
import com.bank.riskcontrol.dto.AccountResponse;
import com.bank.riskcontrol.entity.BankAccount;
import com.bank.riskcontrol.enums.AccountStatus;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.repository.BankAccountRepository;
import com.bank.riskcontrol.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AccountService {
    private final BankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;

    public AccountResponse createAccount(AccountCreateRequest request) throws BusinessException {
        // 检查客户是否存在
        if (!customerRepository.existsById(request.getCustomerId())) {
            throw new BusinessException(400, "客户不存在");
        }

        // 生成账户号
        String accountNo = generateAccountNo();

        BankAccount account = BankAccount.builder()
                .accountNo(accountNo)
                .customerId(request.getCustomerId())
                .balance(request.getInitialBalance())
                .status(AccountStatus.ACTIVE)
                .build();

        BankAccount saved = bankAccountRepository.save(account);
        return toResponse(saved);
    }

    public AccountResponse getAccount(String accountNo) throws BusinessException {
        BankAccount account = bankAccountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new BusinessException(404, "账户不存在"));
        return toResponse(account);
    }

    public AccountResponse freezeAccount(String accountNo) throws BusinessException {
        BankAccount account = bankAccountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new BusinessException(404, "账户不存在"));

        if (account.getStatus() == AccountStatus.FROZEN) {
            throw new BusinessException(400, "账户已经是冻结状态");
        }

        account.setStatus(AccountStatus.FROZEN);
        return toResponse(bankAccountRepository.save(account));
    }

    public AccountResponse unfreezeAccount(String accountNo) throws BusinessException {
        BankAccount account = bankAccountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new BusinessException(404, "账户不存在"));

        if (account.getStatus() == AccountStatus.ACTIVE) {
            throw new BusinessException(400, "账户已经是正常状态");
        }

        account.setStatus(AccountStatus.ACTIVE);
        return toResponse(bankAccountRepository.save(account));
    }

    // 生成账户号：ACC + 时间戳
    private String generateAccountNo() {
        String accountNo;
        do {
            accountNo = "ACC" + System.currentTimeMillis();
        } while (bankAccountRepository.existsByAccountNo(accountNo));
        return accountNo;
    }

    private AccountResponse toResponse(BankAccount account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNo(account.getAccountNo())
                .customerId(account.getCustomerId())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
