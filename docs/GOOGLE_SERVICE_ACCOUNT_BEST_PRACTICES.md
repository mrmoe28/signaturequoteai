# Google Cloud Service Account Key Best Practices

*Source: [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)*

## Overview

Unlike user accounts, service accounts are designed to be used by applications and other workloads. Service account keys are long-lived credentials that can be used to authenticate as a service account. This document outlines best practices for managing service account keys securely.

## Key Security Principles

### 1. Avoid Service Account Keys When Possible

**Best Practice**: Use alternative authentication methods instead of service account keys whenever possible.

**Alternatives to Service Account Keys:**
- **Attached Service Accounts**: For applications running on Google Cloud
- **Workload Identity Federation**: For applications running outside Google Cloud
- **Application Default Credentials (ADC)**: For local development
- **Short-lived credentials**: Using the Service Account Credentials API

### 2. Use Cloud-Based Secret Management

**Best Practice**: Store service account keys in cloud-based secret management services.

**Recommended Services:**
- Google Secret Manager
- Azure KeyVault
- AWS Secret Manager

**Benefits:**
- Centralized key management
- Automatic rotation capabilities
- Access logging and monitoring
- Integration with existing identity systems

### 3. Avoid Editor Role in Projects with Service Account Key Creation

**Best Practice**: Don't use the Editor role in projects that allow service account key creation or upload.

**Why**: The Editor role can be abused for privilege escalation through service account key creation.

**Alternative**: Use more narrowly defined predefined roles or custom roles with only necessary permissions.

**Mitigation**: If Editor role is necessary, disable service account key upload and key creation using organization policy constraints.

### 4. Avoid Service Account Keys for Domain-Wide Delegation

**Best Practice**: Use the signJwt API instead of service account keys for domain-wide delegation.

**Process:**
1. Authenticate a service account using attached service account, Workload Identity Federation for GKE, or Workload Identity Federation
2. Construct a JWT and use the `sub` claim to specify the email address of the user
3. Use the signJwt API to sign the JWT
4. Pass the signed JWT to the OAuth2 Token resource to obtain an access token

## Protecting Against Information Disclosure

### Avoid Disclosing Confidential Information in X.509 Certificates

**Best Practice**: Don't add optional attributes to uploaded X.509 certificates.

**Why**: X.509 certificates are publicly accessible via `https://www.googleapis.com/service_accounts/v1/metadata/x509/ACCOUNT_EMAIL`

**Guidelines:**
- Use generic `Subject` fields
- Don't include address or location information
- Only include basic metadata (email address and expiry date)

## Protecting Against Non-Repudiation Threats

### Use Dedicated Service Accounts

**Best Practice**: Use a dedicated service account for each application.

**Why**: Audit logs contain a `principalEmail` field. Sharing service accounts makes it difficult to identify which application performed an activity.

**Benefits:**
- Clear audit trail
- Easier incident investigation
- Better access control

### Use Dedicated Keys for Each Machine

**Best Practice**: Use a dedicated key for each machine that runs an application.

**Why**: Helps identify which machine an activity originated from using the `serviceAccountKeyName` field in audit logs.

**Benefits:**
- Better traceability
- Easier troubleshooting
- Enhanced security monitoring

## Protecting Against Malicious Credential Configurations

### Validate External Keys

**Best Practice**: Validate keys acquired from external sources before using them.

**Validation Steps:**
1. Verify the `type` field is `service_account`
2. Validate the key structure
3. Test authentication before production use

**Security Requirements:**
- Never trust external keys without validation
- Implement proper key validation in your applications
- Use secure channels for key transmission

## Implementation Guidelines

### For SignatureQuoteCrawler Project

Based on these best practices, here's how to implement secure service account management:

1. **Create Dedicated Service Account**
   - Name: `signature-quote-emailer`
   - Purpose: Gmail API email sending only
   - Minimal required permissions

2. **Use Secret Manager for Key Storage**
   - Store service account key in Google Secret Manager
   - Implement key rotation
   - Monitor key usage

3. **Implement Proper Access Controls**
   - Use custom roles instead of Editor role
   - Grant minimal necessary permissions
   - Regular access reviews

4. **Enable Audit Logging**
   - Monitor service account usage
   - Set up alerts for suspicious activity
   - Regular log analysis

## Security Checklist

- [ ] Use alternative authentication methods when possible
- [ ] Store keys in cloud-based secret management
- [ ] Avoid Editor role in projects with service accounts
- [ ] Use dedicated service accounts per application
- [ ] Use dedicated keys per machine
- [ ] Validate external keys before use
- [ ] Enable comprehensive audit logging
- [ ] Implement key rotation policies
- [ ] Regular security reviews

## Next Steps

1. **Review current service account usage** in your project
2. **Implement Secret Manager** for key storage
3. **Create custom roles** with minimal permissions
4. **Set up monitoring and alerting** for service account activity
5. **Regular security audits** of service account usage

## References

- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-using-service-accounts)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Secret Manager](https://cloud.google.com/secret-manager)

---

*Last updated: September 12, 2025*
*Source: Google Cloud IAM Documentation*