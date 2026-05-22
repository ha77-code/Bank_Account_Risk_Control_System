package com.bank.riskcontrol.repository;

import com.bank.riskcontrol.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByAccountNo(String accountNo);
    boolean existsByAccountNo(String accountNo);
}
