"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/accordion` (dogfoods the registry) → auto-scanned.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DirectionProvider } from "@/components/ui/direction";

/*
 * Every fixture is upstream's own example, adapted only for our import paths and — for RTL — for
 * the fact that upstream's `useTranslation`/`language-selector` pair does not exist here. The
 * geometry lane mounts all of these, so each one is static: no timers, no random data, no network.
 */

export function accordion(): ReactNode {
  return (
    <Wrapper>
      <Accordion defaultValue={["shipping"]} className="max-w-lg">
        <AccordionItem value="shipping">
          <AccordionTrigger>What are your shipping options?</AccordionTrigger>
          <AccordionContent>
            We offer standard (5-7 days), express (2-3 days), and overnight
            shipping. Free shipping on international orders.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>What is your return policy?</AccordionTrigger>
          <AccordionContent>
            Returns accepted within 30 days. Items must be unused and in
            original packaging. Refunds processed within 5-7 business days.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="support">
          <AccordionTrigger>
            How can I contact customer support?
          </AccordionTrigger>
          <AccordionContent>
            Reach us via email, live chat, or phone. We respond within 24 hours
            during business days.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

export function accordionComposition(): ReactNode {
  return (
    <Wrapper>
      <Accordion defaultValue={["item-1"]} className="max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that match the rest of the system.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

const basicItems = [
  {
    value: "item-1",
    trigger: "How do I reset my password?",
    content:
      "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a link to reset your password. The link will expire in 24 hours.",
  },
  {
    value: "item-2",
    trigger: "Can I change my subscription plan?",
    content:
      "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will be reflected in your next billing cycle.",
  },
  {
    value: "item-3",
    trigger: "What payment methods do you accept?",
    content:
      "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners.",
  },
];

export function accordionBasic(): ReactNode {
  return (
    <Wrapper>
      <Accordion defaultValue={["item-1"]} className="max-w-lg">
        {basicItems.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.trigger}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Wrapper>
  );
}

const multipleItems = [
  {
    value: "notifications",
    trigger: "Notification Settings",
    content:
      "Manage how you receive notifications. You can enable email alerts for updates or push notifications for mobile devices.",
  },
  {
    value: "privacy",
    trigger: "Privacy & Security",
    content:
      "Control your privacy settings and security preferences. Enable two-factor authentication, manage connected devices, review active sessions, and configure data sharing preferences.",
  },
  {
    value: "billing",
    trigger: "Billing & Subscription",
    content:
      "View your current plan, payment history, and upcoming invoices. Update your payment method, change your subscription tier, or cancel your subscription.",
  },
];

export function accordionMultiple(): ReactNode {
  return (
    <Wrapper>
      <Accordion multiple className="max-w-lg" defaultValue={["notifications"]}>
        {multipleItems.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.trigger}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Wrapper>
  );
}

export function accordionDisabled(): ReactNode {
  return (
    <Wrapper>
      <Accordion className="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Can I access my account history?</AccordionTrigger>
          <AccordionContent>
            Yes, you can view your complete account history including all
            transactions, plan changes, and support tickets in the Account
            History section of your dashboard.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" disabled>
          <AccordionTrigger>Premium feature information</AccordionTrigger>
          <AccordionContent>
            This section contains information about premium features. Upgrade
            your plan to access this content.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>How do I update my email address?</AccordionTrigger>
          <AccordionContent>
            You can update your email address in your account settings.
            You&apos;ll receive a verification email at your new address to
            confirm the change.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

const borderItems = [
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "We offer monthly and annual subscription plans. Billing is charged at the beginning of each cycle, and you can cancel anytime. All plans include automatic backups, 24/7 support, and unlimited team members.",
  },
  {
    value: "security",
    trigger: "Is my data secure?",
    content:
      "Yes. We use end-to-end encryption, SOC 2 Type II compliance, and regular third-party security audits. All data is encrypted at rest and in transit using industry-standard protocols.",
  },
  {
    value: "integration",
    trigger: "What integrations do you support?",
    content:
      "We integrate with 500+ popular tools including Slack, Zapier, Salesforce, HubSpot, and more. You can also build custom integrations using our REST API and webhooks.",
  },
];

export function accordionBorders(): ReactNode {
  return (
    <Wrapper>
      <Accordion
        className="max-w-lg rounded-lg border"
        defaultValue={["billing"]}
      >
        {borderItems.map((item) => (
          <AccordionItem
            key={item.value}
            value={item.value}
            className="border-b px-4 last:border-b-0"
          >
            <AccordionTrigger>{item.trigger}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Wrapper>
  );
}

const cardItems = [
  {
    value: "plans",
    trigger: "What subscription plans do you offer?",
    content:
      "We offer three subscription tiers: Starter ($9/month), Professional ($29/month), and Enterprise ($99/month). Each plan includes increasing storage limits, API access, priority support, and team collaboration features.",
  },
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "Billing occurs automatically at the start of each billing cycle. We accept all major credit cards, PayPal, and ACH transfers for enterprise customers. You'll receive an invoice via email after each payment.",
  },
  {
    value: "cancel",
    trigger: "How do I cancel my subscription?",
    content:
      "You can cancel your subscription anytime from your account settings. There are no cancellation fees or penalties. Your access will continue until the end of your current billing period.",
  },
];

export function accordionCard(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Subscription &amp; Billing</CardTitle>
          <CardDescription>
            Common questions about your account, plans, payments and
            cancellations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion defaultValue={["plans"]}>
            {cardItems.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>{item.trigger}</AccordionTrigger>
                <AccordionContent>{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

/*
 * Upstream's RTL example drives its copy through `useTranslation` and a `language-selector` that
 * does not exist here, so the Arabic strings are inline and the subtree is wrapped in our own
 * `DirectionProvider` — which is what Base UI actually reads for logical direction.
 */
const arabicItems = [
  {
    value: "item-1",
    trigger: "كيف يمكنني إعادة تعيين كلمة المرور؟",
    content:
      "انقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، أدخل عنوان بريدك الإلكتروني، وسنرسل لك رابطًا لإعادة تعيين كلمة المرور. سينتهي صلاحية الرابط خلال 24 ساعة.",
  },
  {
    value: "item-2",
    trigger: "هل يمكنني تغيير خطة الاشتراك الخاصة بي؟",
    content:
      "نعم، يمكنك ترقية أو تخفيض خطتك في أي وقت من إعدادات حسابك. ستظهر التغييرات في دورة الفوترة التالية.",
  },
  {
    value: "item-3",
    trigger: "ما هي طرق الدفع التي تقبلونها؟",
    content:
      "نقبل جميع بطاقات الائتمان الرئيسية و PayPal والتحويلات المصرفية. تتم معالجة جميع المدفوعات بأمان من خلال شركاء الدفع لدينا.",
  },
];

export function accordionRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Accordion defaultValue={["item-1"]} className="max-w-md">
          {arabicItems.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.trigger}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Wrapper>
    </DirectionProvider>
  );
}
