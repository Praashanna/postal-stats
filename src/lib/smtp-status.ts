type SmtpStatusInfo = {
  summary: string;
  description: string;
};

const ENHANCED_STATUS_CODES: Record<string, SmtpStatusInfo> = {
  "X.0.0": {
    summary: "Other or undefined status",
    description: "Only the status class is known.",
  },
  "X.1.0": {
    summary: "Other address status",
    description: "Something about the sender or recipient address caused the status.",
  },
  "X.1.1": {
    summary: "Bad destination mailbox address",
    description: "The recipient mailbox does not exist or the local part before @ is invalid.",
  },
  "X.1.2": {
    summary: "Bad destination system address",
    description: "The destination domain does not exist or cannot accept mail.",
  },
  "X.1.3": {
    summary: "Bad destination mailbox address syntax",
    description: "The destination address is syntactically invalid.",
  },
  "X.1.4": {
    summary: "Destination mailbox address ambiguous",
    description: "The address matches more than one recipient on the destination system.",
  },
  "X.1.5": {
    summary: "Destination address valid",
    description: "The recipient address is valid.",
  },
  "X.1.6": {
    summary: "Destination mailbox moved",
    description: "The mailbox was once valid, but no longer accepts mail and has no forwarding address.",
  },
  "X.1.7": {
    summary: "Bad sender mailbox address syntax",
    description: "The sender address is syntactically invalid.",
  },
  "X.1.8": {
    summary: "Bad sender system address",
    description: "The sender domain does not exist or cannot accept return mail.",
  },
  "X.1.9": {
    summary: "Relayed to non-compliant mailer",
    description: "The mailbox is valid, but the next system cannot provide further protocol status.",
  },
  "X.1.10": {
    summary: "Recipient address has null MX",
    description: "The recipient domain explicitly indicates it does not accept mail.",
  },
  "X.2.0": {
    summary: "Other mailbox status",
    description: "The mailbox exists, but another mailbox condition caused the status.",
  },
  "X.2.1": {
    summary: "Mailbox disabled",
    description: "The mailbox exists, but is not accepting messages.",
  },
  "X.2.2": {
    summary: "Mailbox full",
    description: "The recipient mailbox exceeded its quota or storage capacity.",
  },
  "X.2.3": {
    summary: "Message too large for mailbox",
    description: "The message exceeds a per-mailbox size limit.",
  },
  "X.2.4": {
    summary: "Mailing list expansion problem",
    description: "The mailing list address could not be expanded.",
  },
  "X.3.0": {
    summary: "Other mail system status",
    description: "The destination system normally accepts mail, but another system condition caused the status.",
  },
  "X.3.1": {
    summary: "Mail system full",
    description: "The destination mail system storage has been exceeded.",
  },
  "X.3.2": {
    summary: "System not accepting messages",
    description: "The destination host is not accepting mail, possibly due to load, shutdown, or maintenance.",
  },
  "X.3.3": {
    summary: "System feature unsupported",
    description: "The destination system does not support selected message features.",
  },
  "X.3.4": {
    summary: "Message too large for system",
    description: "The message exceeds a system-wide message size limit.",
  },
  "X.3.5": {
    summary: "System incorrectly configured",
    description: "The destination system is not configured to accept this message.",
  },
  "X.3.6": {
    summary: "Requested priority changed",
    description: "The message was accepted, but the requested priority was changed.",
  },
  "X.4.0": {
    summary: "Other network or routing status",
    description: "A network or routing problem occurred, but no more specific code applies.",
  },
  "X.4.1": {
    summary: "No answer from host",
    description: "The remote host did not answer the outbound connection attempt.",
  },
  "X.4.2": {
    summary: "Bad connection",
    description: "The connection was established but could not complete the mail transaction.",
  },
  "X.4.3": {
    summary: "Directory server failure",
    description: "A directory service such as DNS was unavailable.",
  },
  "X.4.4": {
    summary: "Unable to route",
    description: "The mail system could not determine the next hop for delivery.",
  },
  "X.4.5": {
    summary: "Mail system congestion",
    description: "The mail system was too congested to deliver the message.",
  },
  "X.4.6": {
    summary: "Routing loop detected",
    description: "The message was forwarded too many times because of a routing or forwarding loop.",
  },
  "X.4.7": {
    summary: "Delivery time expired",
    description: "The message was considered too old to keep attempting delivery.",
  },
  "X.5.0": {
    summary: "Other protocol status",
    description: "A mail delivery protocol problem occurred, but no more specific code applies.",
  },
  "X.5.1": {
    summary: "Invalid command",
    description: "A protocol command was out of sequence or unsupported.",
  },
  "X.5.2": {
    summary: "Syntax error",
    description: "A protocol command could not be interpreted.",
  },
  "X.5.3": {
    summary: "Too many recipients",
    description: "More recipients were specified than could be delivered in the transaction.",
  },
  "X.5.4": {
    summary: "Invalid command arguments",
    description: "A command used invalid, unsupported, or out-of-range arguments.",
  },
  "X.5.5": {
    summary: "Wrong protocol version",
    description: "The systems could not resolve a protocol version mismatch.",
  },
  "X.5.6": {
    summary: "Authentication exchange line too long",
    description: "An AUTH response exceeded the server's maximum supported line size.",
  },
  "X.6.0": {
    summary: "Other media error",
    description: "Message content caused delivery failure, but no more specific code applies.",
  },
  "X.6.1": {
    summary: "Media not supported",
    description: "The message media type is unsupported by the delivery path.",
  },
  "X.6.2": {
    summary: "Conversion required and prohibited",
    description: "The message needs conversion, but conversion is not permitted.",
  },
  "X.6.3": {
    summary: "Conversion required but unsupported",
    description: "The message needs conversion, but conversion is not practical or possible.",
  },
  "X.6.4": {
    summary: "Conversion with loss performed",
    description: "Delivery required conversion that lost some data.",
  },
  "X.6.5": {
    summary: "Conversion failed",
    description: "A required message conversion was unsuccessful.",
  },
  "X.6.6": {
    summary: "Message content unavailable",
    description: "Message content could not be fetched from a remote system.",
  },
  "X.6.7": {
    summary: "Non-ASCII addresses not permitted",
    description: "A sender or recipient address used non-ASCII characters that are not permitted.",
  },
  "X.6.8": {
    summary: "UTF-8 reply not permitted",
    description: "A UTF-8 reply is required, but the SMTP client does not permit it.",
  },
  "X.6.9": {
    summary: "UTF-8 header cannot be transferred",
    description: "The message has UTF-8 headers that cannot be transferred to one or more recipients.",
  },
  "X.7.0": {
    summary: "Other security or policy status",
    description: "A security or policy condition caused the status, but no more specific code applies.",
  },
  "X.7.1": {
    summary: "Delivery not authorized",
    description: "The sender is not authorized to send to the destination, often due to filtering or policy.",
  },
  "X.7.2": {
    summary: "Mailing list expansion prohibited",
    description: "The sender is not authorized to send to the mailing list.",
  },
  "X.7.3": {
    summary: "Security conversion required",
    description: "A required secure-message conversion was not possible.",
  },
  "X.7.4": {
    summary: "Security features unsupported",
    description: "The message requested security features unsupported by the delivery protocol.",
  },
  "X.7.5": {
    summary: "Cryptographic failure",
    description: "A required validation or decryption step failed because key material was missing or invalid.",
  },
  "X.7.6": {
    summary: "Cryptographic algorithm unsupported",
    description: "A required validation or decryption algorithm is unsupported.",
  },
  "X.7.7": {
    summary: "Message integrity failure",
    description: "The message could not be validated because it was corrupted or altered.",
  },
  "X.7.8": {
    summary: "Invalid authentication credentials",
    description: "Authentication failed due to invalid or insufficient credentials.",
  },
  "X.7.9": {
    summary: "Authentication mechanism too weak",
    description: "The selected authentication mechanism is weaker than server policy permits.",
  },
  "X.7.10": {
    summary: "Encryption needed",
    description: "A stronger privacy layer, such as TLS, is needed for the requested authentication mechanism.",
  },
  "X.7.11": {
    summary: "Encryption required for authentication",
    description: "The selected authentication mechanism can only be used over an encrypted connection.",
  },
  "X.7.12": {
    summary: "Password transition needed",
    description: "The user must transition to the selected authentication mechanism.",
  },
  "X.7.13": {
    summary: "User account disabled",
    description: "Authentication succeeded, but the user account is disabled.",
  },
  "X.7.14": {
    summary: "Trust relationship required",
    description: "The submission server requires a configured trust relationship with a third-party server.",
  },
  "X.7.15": {
    summary: "Priority level too low",
    description: "The requested priority is below the receiving server's acceptable priority level.",
  },
  "X.7.16": {
    summary: "Message too large for priority",
    description: "The message is too large for the specified priority level.",
  },
  "X.7.17": {
    summary: "Mailbox owner changed",
    description: "The recipient mailbox has not had continuous ownership since the specified timestamp.",
  },
  "X.7.18": {
    summary: "Domain owner changed",
    description: "The recipient domain ownership changed since the specified timestamp.",
  },
  "X.7.19": {
    summary: "RRVS test cannot be completed",
    description: "The receiving system cannot complete the requested recipient-valid-since evaluation.",
  },
  "X.7.20": {
    summary: "No passing DKIM signature",
    description: "The message did not contain any passing DKIM signatures.",
  },
  "X.7.21": {
    summary: "No acceptable DKIM signature",
    description: "The message has passing DKIM signatures, but none are acceptable to local policy.",
  },
  "X.7.22": {
    summary: "No author-matched DKIM signature",
    description: "No acceptable DKIM signature matches the author address in the From header.",
  },
  "X.7.23": {
    summary: "SPF validation failed",
    description: "The message failed SPF validation under local policy.",
  },
  "X.7.24": {
    summary: "SPF validation error",
    description: "SPF evaluation produced an error.",
  },
  "X.7.25": {
    summary: "Reverse DNS validation failed",
    description: "The SMTP client's IP address failed reverse DNS validation under local policy.",
  },
  "X.7.26": {
    summary: "Multiple authentication checks failed",
    description: "The message failed more than one authentication check under local policy.",
  },
  "X.7.27": {
    summary: "Sender address has null MX",
    description: "The sender domain explicitly indicates it does not accept mail.",
  },
  "X.7.28": {
    summary: "Mail flood detected",
    description: "The message appears to be part of a flood of similar abusive messages.",
  },
  "X.7.29": {
    summary: "ARC validation failure",
    description: "The message failed ARC validation.",
  },
  "X.7.30": {
    summary: "REQUIRETLS support required",
    description: "The message could not be forwarded because REQUIRETLS support was unavailable.",
  },
};

const BASIC_STATUS_CODES: Record<string, SmtpStatusInfo> = {
  "211": { summary: "System status", description: "System status or help reply." },
  "214": { summary: "Help message", description: "Information intended for a human user." },
  "220": { summary: "Service ready", description: "The SMTP service is ready." },
  "221": { summary: "Service closing", description: "The SMTP service is closing the transmission channel." },
  "250": { summary: "Mail action completed", description: "The requested mail action completed successfully." },
  "251": { summary: "User not local", description: "The server will forward the message to another path." },
  "252": { summary: "Cannot verify user", description: "The server cannot verify the user, but will attempt delivery." },
  "354": { summary: "Start mail input", description: "The server is ready to receive message data." },
  "421": { summary: "Service unavailable", description: "The service is unavailable and is closing the channel." },
  "450": { summary: "Mailbox temporarily unavailable", description: "The mailbox is busy, temporarily blocked, or otherwise unavailable." },
  "451": { summary: "Local processing error", description: "The action was aborted because of a local processing error." },
  "452": { summary: "Insufficient storage", description: "The action was not taken because system storage is insufficient." },
  "455": { summary: "Parameters not accommodated", description: "The server cannot accommodate the supplied parameters." },
  "500": { summary: "Command syntax error", description: "The command is unrecognized or too long." },
  "501": { summary: "Parameter syntax error", description: "The command parameters or arguments are syntactically invalid." },
  "502": { summary: "Command not implemented", description: "The server recognizes the command but has not implemented it." },
  "503": { summary: "Bad command sequence", description: "The command was sent out of sequence." },
  "504": { summary: "Command parameter unsupported", description: "A command parameter is not implemented." },
  "550": { summary: "Mailbox unavailable", description: "The mailbox was not found, access was denied, or policy rejected the command." },
  "551": { summary: "User not local", description: "The recipient is not local; another forward path may be available." },
  "552": { summary: "Storage allocation exceeded", description: "The mail action was aborted because storage allocation was exceeded." },
  "553": { summary: "Mailbox name not allowed", description: "The mailbox name is not allowed or has invalid syntax." },
  "554": { summary: "Transaction failed", description: "The transaction failed or no SMTP service is available." },
  "555": { summary: "MAIL/RCPT parameter unsupported", description: "MAIL FROM or RCPT TO parameters are not recognized or implemented." },
};

export function getSmtpStatusInfo(errorType: string): SmtpStatusInfo | null {
  const [basicCode, enhancedCode] = errorType.trim().split(/\s+/);

  if (enhancedCode) {
    const enhancedParts = enhancedCode.split(".");

    if (enhancedParts.length === 3) {
      const registryCode = `X.${enhancedParts[1]}.${enhancedParts[2]}`;
      const enhancedInfo = ENHANCED_STATUS_CODES[registryCode];

      if (enhancedInfo) {
        return enhancedInfo;
      }
    }
  }

  return BASIC_STATUS_CODES[basicCode] ?? null;
}
