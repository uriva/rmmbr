# Service Level Agreement (SLA)

This Service Level Agreement ("SLA") applies to the use of rmmbr ("rmmbr" "us" or "we"). The service is offered under the terms of our Terms of Service or other agreement with us governing Customer's use of our Products and Services (the "Agreement"). It is clarified that this SLA is part of and subject to the terms of the Agreement, and capitalized terms, unless otherwise indicated herein, have the meaning specified in the Agreement. We reserves the right to change the terms of this SLA by publishing updated terms, such change to be effective as of the date of publication.

## Service Commitments

These Service Commitments and Service Credits apply to deployments that have been up for a minimum of 24 hours, and apply separately to each Commercial Subscription of the service.

We will use commercially reasonable efforts to maximize the availability of our service, and provide Monthly Uptime Percentages (defined below) of at least 99.9%. In the event that the service do not meet this Service Commitment, Customer will be eligible to receive a Service Credit as described below.

## Definitions

"Deployment Minutes" is the total number of minutes that a given cache has been deployed with the the service during a billing month.

"Downtime" is the total accumulated Deployment Minutes (across all caches deployed by a Customer in a given the service subscription) during which the cache is unavailable. A minute is considered unavailable for a given cache if all continuous attempts by a Customer to establish a connection to the cache within that minute fail. Furthermore, "Downtime" does not include downtime for Maintenance. Additionally, partial minutes of unavailability will not be counted towards Downtime.

"Maintenance" is the incorporation of new features, upgrades, updates, cluster optimization, patches, and/or bug fixes performed on the service.

"Maximum Available Minutes" is the sum of all Deployment Minutes across all caches deployed by a Customer during a billing month.

"Monthly Uptime Percentage" for a cache is calculated as the Maximum Available Minutes less Downtime divided by Maximum Available Minutes in a billing month for a given subscription. This Monthly Uptime Percentage is represented by the following formula:

Monthly Uptime % = (Maximum Available Minutes – Downtime) / Maximum Available Minutes.

"Service Credit" is a credit or discount toward future use of our service and is Customer's sole and exclusive remedy for any failure by us to provide the service in compliance with the Service Commitment or any other representation or warranty.

## Service Credits

Service Credits are calculated as a percentage of the monthly charges paid by Customer for the service Commercial Subscription that did not meet the applicable Service Commitment in a billing cycle in accordance with the schedule below:

| Monthly uptime percentage %                       | Service credit precentage % |
| ------------------------------------------------- | --------------------------- |
| Less than 99.9%, but equal to or greater than 99% | 10%                         |
| Less than 99%                                     | 25%                         |

We will only apply Service Credits against future payments for our service. At our discretion, we may issue Service Credits to the Payment Method Customer used to pay for the billing cycle in which the failure to meet the Service Commitment occurred. Service Credits will not entitle Customer to any refund or other payment from us. Service Credits may not be transferred or applied to any other account. Unless otherwise indicated in the Agreement, Customer's sole and exclusive remedy for any unavailability, non-performance or other failure by us to provide the service in compliance with the Service Commitment or any other representation or warranty by us is the receipt of Service Credits (if eligible) in accordance with the terms of this SLA.

## Credit Request and Payment Procedures

To receive a Service Credit, Customer must take all of the following actions:

1. log a support ticket with us within 24 hours of first becoming aware of an event that has impacted service availability
1. submit to us a credit request with respect to such event, including the information specified below and other related information which may be requested by us, by the end of the second billing cycle after which the incident occurred. For example, if the Downtime occurred on February 15th, we must receive a support ticket within 24 hours of Customer becoming aware of such Downtime, and receive a credit request including all required information by March 31st. The credit request must include:

1. The words "SLA Credit Request" in the subject line;
1. The dates and times of each Downtime incident Customer are claiming;
1. The cache(s) name, the cloud(s) name and regions of the affected cache;
1. Logs that document the errors and corroborate Customer's claimed outage (any confidential or sensitive information in these logs should be removed or replaced with asterisks);

If the Monthly Uptime Percentage of such credit request is confirmed by us and is less than the Service Commitment, we will issue the Service Credits to Customer within one billing cycle following the month in which the credit request occurred. Failure to provide the credit request and other required information above will disqualify Customer from receiving Service Credits. Furthermore, Customer must be in compliance with the Agreement in order to be eligible for a Service Credit and will otherwise not be entitled, even if all other requirements hereunder are met.

## SLA Exclusions

That result from a suspension described in the Agreement;
That result from any voluntary actions or inactions from Customer or any third party (e.g. rebooting, shutting down or any access to a cloud instance that is part of our system; if our system is deployed on Customer's VPC, these actions might include misconfiguring security groups, VPC configurations or credential settings, disabling encryption keys or making the encryption keys inaccessible, attempting to connect from an IP address that has not been confirmed and processed in the whitelist of approved IP addresses, attempting to connect when the number of connections is already at the connection limit, client-side DNS issues, etc.);
Due to factors outside our reasonable control (for example, natural disasters, war, acts of terrorism, riots, government action or a network or device failure at Customer's site or between Customer's site and our service);
That result from the use of services, hardware or software provided by a third party, including issues resulting from inadequate bandwidth or related to third-party software or services, such as cloud platform services on which our service run;
Caused by Customer's use of the service after we advised Customer to modify Customer's use of the service, if Customer did not modify their use as advised;
During or with respect to preview, pre-release, beta or trial versions of the service, a faulty version of the service that is still pending Customer's approval in order to be upgraded to a better version, feature or software (as determined by us);
That result from Customer's unauthorized action or lack of action when required, or from Customer's employees, agents, contractors or vendors, or anyone gaining access to our network by means of Customer's passwords or equipment, or otherwise resulting from Customer's failure to follow appropriate security practices;
That result from Customer's failure to adhere to any required configurations, use supported platforms, follow any policies for acceptable use, or Customer's use of the Service in a manner inconsistent with the features and functionality of the Service (for example, attempts to perform operations that are not supported) or inconsistent with our published guidance;
That result from faulty input, instructions or arguments (for example, a request to run a Lua script that runs in an infinite loop); or
That result from Customer's attempts to perform operations that exceed prescribed quotas or that resulted from our throttling of suspected abusive behavior; or arising from our suspension and termination of Customer's right to use our service in accordance with the Agreement.
If availability is impacted by factors other than those explicitly used in our Monthly Uptime Percentage calculation, then we may at our sole discretion, decide to regardless consider such factors and issue a corresponding Service Credit. service based on older versions will be completely terminated and unavailable 18 months after an upgrade or as announced by us.

## Maintenance Notice

We may schedule and perform Maintenance at our sole discretion and will provide notice to Customer when Maintenance begins and when it ends. If upcoming Maintenance is a high impact event, at our sole discretion, we will provide reasonable advance notice to Customers with annual or flexible plans only. Notwithstanding plan type or any Maintenance Windows selected, we reserve the right to perform urgent Maintenance activities as soon as they are needed.

## Customer Cooperation

If Customer-side actions are necessary in advance of Maintenance, Customer will be given notice and a reasonable amount of time to make the necessary modifications or actions in its deployment environment for Maintenance support. If Customer fails to do so, the applicable SLA will not apply after such Maintenance, and Customer recognizes and agrees that we will not be liable for data or information loss of any kind, availability issues, security issues, or other related issues or damages that may have been mitigated or avoided by following our instructions in the Maintenance notice.
