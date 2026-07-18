'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/alert-dialog` (dogfoods the registry) → auto-scanned.
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogIntent,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function alertDialog(): ReactNode {
  return (
    <Wrapper>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive-outline">Delete project</Button>} />
        <AlertDialogContent intent="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and all of its data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction intent="destructive">Delete project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Wrapper>
  );
}

const INTENTS: {
  intent: AlertDialogIntent;
  label: string;
  title: string;
  description: string;
  confirm: string;
}[] = [
  {
    intent: 'default',
    label: 'Default',
    title: 'Publish release?',
    description: 'This makes version 2.0 available to everyone in your workspace.',
    confirm: 'Publish',
  },
  {
    intent: 'destructive',
    label: 'Destructive',
    title: 'Delete workspace?',
    description: 'This permanently removes the workspace and every project inside it.',
    confirm: 'Delete',
  },
  {
    intent: 'success',
    label: 'Success',
    title: 'Keep current plan?',
    description: 'Your plan stays on Pro and your next invoice is unchanged.',
    confirm: 'Keep plan',
  },
  {
    intent: 'warning',
    label: 'Warning',
    title: 'Reset API keys?',
    description: 'Existing keys stop working immediately. Integrations must be reconnected.',
    confirm: 'Reset keys',
  },
];

export function alertDialogIntents(): ReactNode {
  return (
    <Wrapper>
      {INTENTS.map(({ intent, label, title, description, confirm }) => (
        <AlertDialog key={intent}>
          <AlertDialogTrigger render={<Button variant="outline">{label}</Button>} />
          <AlertDialogContent intent={intent}>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction intent={intent}>{confirm}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </Wrapper>
  );
}

const TERMS_SECTIONS = [
  'You retain ownership of the content you upload, but grant us a license to host, process, and display it as needed to operate the service.',
  'We process personal data in line with our Privacy Policy. By accepting, you consent to the data handling described there, including transfers required to deliver the product.',
  'The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation, and your use is at your own risk.',
  'Our aggregate liability is limited to the fees you paid in the twelve months preceding the claim. We are not liable for indirect, incidental, or consequential damages.',
  'We may suspend or terminate access for violations of these terms. On termination, your right to use the service ends immediately and outstanding fees become due.',
  'These terms are governed by the laws of the contracting entity’s jurisdiction. Disputes are resolved through binding arbitration, waiving any right to a jury trial.',
  'We may update these terms from time to time. Continued use after an update constitutes acceptance of the revised terms, which we will surface in-product before they take effect.',
];

export function alertDialogScrollable(): ReactNode {
  return (
    <Wrapper>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline">Review terms</Button>} />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept updated terms?</AlertDialogTitle>
            <AlertDialogDescription>
              Review the full terms below before continuing. You must accept to keep using the
              workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="-mx-1 flex flex-col gap-3 overflow-y-auto px-1 text-base leading-relaxed text-muted-foreground">
            {TERMS_SECTIONS.map((paragraph, index) => (
              <p key={index}>
                <span className="font-medium text-foreground">{index + 1}.</span> {paragraph}
              </p>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Decline</AlertDialogCancel>
            <AlertDialogAction>Accept terms</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Wrapper>
  );
}
