package com.bank.riskcontrol.repository;

import com.bank.riskcontrol.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByIdCardNo(String idCardNo);
}
