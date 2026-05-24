package com.bank.riskcontrol.service;

import com.bank.riskcontrol.dto.AccountCreateRequest;
import com.bank.riskcontrol.dto.AccountResponse;
import com.bank.riskcontrol.dto.CustomerCreateRequest;
import com.bank.riskcontrol.enums.AccountStatus;
import com.bank.riskcontrol.exception.BusinessException;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AccountServiceTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private CustomerService customerService;

    private Long customerId;

    @BeforeEach
    void setup() throws BusinessException {
        CustomerCreateRequest req = new CustomerCreateRequest();
        req.setName("测试用户");
        req.setIdCardNo("ID" + System.currentTimeMillis());
        req.setPhone("13900000000");
        customerId = customerService.createCustomer(req).getId();
    }

    @Test
    @DisplayName("创建账户成功")
    void createAccountSuccess() throws BusinessException {
        AccountCreateRequest req = new AccountCreateRequest();
        req.setCustomerId(customerId);
        req.setInitialBalance(new BigDecimal("5000"));

        AccountResponse result = accountService.createAccount(req);

        assertNotNull(result.getAccountNo());
        assertEquals(AccountStatus.ACTIVE, result.getStatus());
        assertEquals(new BigDecimal("5000"), result.getBalance());
    }

    @Test
    @DisplayName("客户不存在时创建账户抛出异常")
    void createAccountCustomerNotFound() {
        AccountCreateRequest req = new AccountCreateRequest();
        req.setCustomerId(99999L);
        req.setInitialBalance(new BigDecimal("1000"));

        assertThrows(BusinessException.class,
                () -> accountService.createAccount(req));
    }

    @Test
    @DisplayName("冻结账户成功")
    void freezeAccountSuccess() throws BusinessException {
        AccountCreateRequest req = new AccountCreateRequest();
        req.setCustomerId(customerId);
        req.setInitialBalance(new BigDecimal("1000"));
        String accountNo = accountService.createAccount(req).getAccountNo();

        AccountResponse result = accountService.freezeAccount(accountNo);

        assertEquals(AccountStatus.FROZEN, result.getStatus());
    }

    @Test
    @DisplayName("重复冻结抛出异常")
    void freezeAlreadyFrozenThrows() throws BusinessException {
        AccountCreateRequest req = new AccountCreateRequest();
        req.setCustomerId(customerId);
        req.setInitialBalance(new BigDecimal("1000"));
        String accountNo = accountService.createAccount(req).getAccountNo();

        accountService.freezeAccount(accountNo);

        assertThrows(BusinessException.class,
                () -> accountService.freezeAccount(accountNo));
    }
}
