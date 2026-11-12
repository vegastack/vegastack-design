"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  CopyIcon,
  FileText,
  Globe,
  Mail,
  Pencil,
  Users,
  RefreshCcwIcon,
  Search,
  Sparkles,
  SquareCheck,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/message-parts` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Citation } from "@/components/ui/cited-list";
import {
  Message,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  MessageActions,
  MessageActivity,
  MessageActivityFold,
  MessageActivityGroup,
  MessageActivityNote,
  MessageActivityResults,
  MessageActivityStep,
  MessageBubble,
  MessageChange,
  MessageDisclaimer,
  MessageFold,
  MessageHandoff,
  MessageNotice,
  MessagePlan,
  MessageSourceList,
  MessageSources,
  MessageStatus,
  MessageTime,
  MessageStep,
  MessageSteps,
  MessageVersionSwitch,
} from "@/components/ui/message-parts";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Toggle } from "@/components/ui/toggle";

const assistant = { name: "Assistant", kind: "agent" as const };

function AgentHeader({ name = "Assistant" }: { name?: string }): ReactNode {
  return (
    <MessageHeader className="gap-2 px-0">
      <PersonAvatar person={{ ...assistant, name }} size="sm" />
      {name}
    </MessageHeader>
  );
}

function Actions({ reveal }: { reveal?: "hover" | "always" }): ReactNode {
  // Ghost buttons for actions, toggles for the rating — the row makes every one the same 28px
  // square with a 16px icon.
  return (
    <MessageActions reveal={reveal}>
      <Button size="icon-sm" variant="ghost" aria-label="Copy">
        <CopyIcon aria-hidden />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Retry">
        <RefreshCcwIcon aria-hidden />
      </Button>
      <Toggle aria-label="Good answer">
        <ThumbsUpIcon aria-hidden />
      </Toggle>
      <Toggle aria-label="Bad answer">
        <ThumbsDownIcon aria-hidden />
      </Toggle>
    </MessageActions>
  );
}

/** A site's icon, drawn inline so the docs call no site. A host serves real ones from its proxy. */
function siteIcon(hue: number, shape: "circle" | "square" = "square"): string {
  const mark =
    shape === "circle"
      ? `<circle cx='8' cy='8' r='6' fill='oklch(0.62 0.17 ${hue})'/>`
      : `<rect x='2' y='2' width='12' height='12' rx='3' fill='oklch(0.62 0.17 ${hue})'/><path d='M5 8h6M8 5v6' stroke='white' stroke-width='1.6' stroke-linecap='round'/>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>${mark}</svg>`)}`;
}

const WEB_SOURCES = [
  {
    href: "https://www.ies.org/standards/tm-21",
    title:
      "TM-21-21 — Projecting long-term luminous flux maintenance of LED packages",
    site: "ies.org",
    icon: siteIcon(250),
  },
  {
    href: "https://www.energystar.gov/lm80",
    title: "LM-80 test reports: what they cover and what they don't",
    site: "energystar.gov",
    icon: siteIcon(150, "circle"),
  },
  {
    href: "https://hi-hyperlite.com/lm80-tm21",
    title: "LM-80 & TM-21 reports: predicting high bay lifespan",
    site: "hi-hyperlite.com",
    icon: siteIcon(30),
  },
  {
    href: "https://example.org/missing",
    title: null,
    site: "lighting-research.example",
    // A favicon that fails to load falls back to the globe.
    icon: "/favicon-that-does-not-exist.png",
  },
];

const ANSWER = `LED lifetime claims rest on two documents. **LM-80** measures how a package's light output falls over at least 6,000 hours [[2]], and **TM-21** projects that data forward — never more than six times the tested hours [[1]].

### What to ask a supplier for

1. The LM-80 report for the exact package and drive current.
2. The TM-21 projection, with the sample size and case temperature.
3. The in-situ temperature of the fixture [[3]].

A claim of *L70 > 100,000 h* from a 6,000-hour test is outside TM-21's limit, so treat it as marketing.`;

function Answer(): ReactNode {
  return (
    <MarkdownView
      typeScale="reading"
      citation={(n) => {
        const source = WEB_SOURCES[n - 1];
        if (!source) return null;
        return {
          label: `Source ${n}: ${source.title ?? source.site}`,
          content: (
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex max-w-72 flex-col gap-0.5 text-sm no-underline"
            >
              <span className="font-medium text-foreground">
                {source.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {source.site} ↗
              </span>
            </a>
          ),
        };
      }}
    >
      {ANSWER}
    </MarkdownView>
  );
}

// A fixed clock, so the server render and the browser agree on every timestamp.
const NOW = Date.parse("2026-11-10T10:00:00Z");
const TEN_MINUTES_AGO = NOW - 10 * 60_000;

export function messageParts(): ReactNode {
  // A whole turn: the person's message and its time, then the agent's answer with its activity,
  // its sources, its actions and its time on hover.
  return (
    <Wrapper className="items-start justify-start">
      <MessageGroup className="w-full max-w-md gap-6">
        <Message align="end">
          <MessageContent className="gap-1">
            <MessageBubble>
              {
                "How long do LM-80 and TM-21 let a supplier claim?\nOur high bay says 100,000 h."
              }
            </MessageBubble>
            <MessageTime date={TEN_MINUTES_AGO} now={NOW} />
          </MessageContent>
        </Message>
        <Message>
          <MessageContent>
            <AgentHeader />
            <MessageActivity
              icon={<Sparkles />}
              summary="Searched the web · 2 searches"
              ms={14_000}
            >
              <MessageActivityNote>
                Planning a search for LM-80 and TM-21.
              </MessageActivityNote>
              <MessageActivityStep
                icon={<Search />}
                label="Searched the web"
                detail="TM-21 projection limit"
                meta="3 results"
              >
                <MessageActivityResults results={WEB_SOURCES.slice(0, 3)} />
              </MessageActivityStep>
            </MessageActivity>
            <Answer />
            <MessageSourceList sources={WEB_SOURCES.slice(0, 3)} />
            <div className="flex items-center gap-2">
              <Actions reveal="always" />
              <MessageTime date={TEN_MINUTES_AGO} now={NOW} reveal="hover" />
            </div>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messagePartsBubble(): ReactNode {
  // A person's message: the muted surface, foreground text, their line breaks kept.
  return (
    <Wrapper className="items-start justify-start">
      <MessageGroup className="w-full max-w-md gap-4">
        <Message align="end">
          <MessageContent className="gap-1">
            <MessageBubble>Search the web for TM-21.</MessageBubble>
            <MessageTime date={TEN_MINUTES_AGO} now={NOW} />
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent className="gap-1">
            <MessageBubble>
              {
                "Compare these two high bays:\n- 150 W, 160 lm/W, IP65\n- 200 W, 150 lm/W, IP66\n\nWhich lasts longer at 45 °C ambient, and how sure can we be?"
              }
            </MessageBubble>
            <MessageTime date={NOW - 3 * 86_400_000} now={NOW} />
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messagePartsActivity(): ReactNode {
  // Done, opened: notes in muted text, steps, a search open on its results, a failed step's reason.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        icon={<Sparkles />}
        summary="Searched the web · 2 searches"
        ms={14_000}
        className="w-full max-w-md"
      >
        <MessageActivityNote>
          Planning a search for LM-80 and TM-21, then reading the standard
          itself.
        </MessageActivityNote>
        <MessageActivityStep
          defaultOpen
          icon={<Search />}
          label="Searched the web"
          detail="TM-21 projection limit"
          meta="4 results"
        >
          <MessageActivityResults results={WEB_SOURCES} />
        </MessageActivityStep>
        <MessageActivityStep
          icon={<Search />}
          label="Searched the web"
          detail="LM-80 6000 hours test duration"
          meta="2 results"
        >
          <MessageActivityResults results={WEB_SOURCES.slice(1, 3)} />
        </MessageActivityStep>
        <MessageActivityStep
          icon={<Globe />}
          label="Opened"
          detail="ies.org/standards/tm-21"
        />
        <MessageActivityStep
          status="failed"
          icon={<Globe />}
          label="Opened"
          detail="hi-hyperlite.com/lm80-tm21"
          error="The site didn't answer."
        />
        <MessageActivityStep
          icon={<BookOpen />}
          label="Used skill"
          detail="Datasheet check"
        />
        <MessageActivityStep
          icon={<Brain />}
          label="Saved to memory"
          detail="Prefers TM-21 numbers over supplier claims"
        />
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivityRunning(): ReactNode {
  // Working: the current step shimmers with a live timer, open for the person who asked.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        running
        startedAt={Date.now() - 6_000}
        icon={<Sparkles />}
        summary="Searching the web"
        className="w-full max-w-md"
      >
        <MessageActivityNote>
          Planning a search for LM-80 and TM-21.
        </MessageActivityNote>
        <MessageActivityStep
          status="running"
          label="Searching the web"
          detail="TM-21 projection limit"
        />
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivityError(): ReactNode {
  // Done with a step that didn't finish: the closed line keeps the warning; the step says why and
  // what to do next. Consecutive reads fold into one row.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        icon={<Sparkles />}
        summary="Worked for 14s · 4 steps"
        warning="1 didn't finish"
        className="w-full max-w-xl"
      >
        <MessageActivityNote label="Thinking" ms={3_000}>
          I'll check what's open for Q4 first, then update the late ones and
          tell Ana.
        </MessageActivityNote>
        <MessageActivityStep
          icon={<Search />}
          verb="Searched the workspace"
          target="“Q4 launch”"
          summary="6 results"
          ms={1_200}
        />
        <MessageActivityFold
          icon={<FileText />}
          verb="Read 5 records"
          names={["TTB-12", "TTB-14", "TTB-15", "TTB-16", "TTB-17"]}
          ms={400}
        >
          {["TTB-12", "TTB-14", "TTB-15", "TTB-16", "TTB-17"].map((ref) => (
            <MessageActivityStep
              key={ref}
              icon={<FileText />}
              verb="Read"
              target={ref}
            />
          ))}
        </MessageActivityFold>
        <MessageActivityStep
          icon={<Pencil />}
          verb="Updated"
          target="TTB-12"
          summary="Status → Done"
          ms={2_000}
        />
        <MessageActivityStep
          status="failed"
          verb="Sent email to"
          target="ana@example.com"
          summary="didn't send"
          reason="Gmail isn't connected for you."
          action={
            <Button variant="link" size="xs" className="px-0">
              Connect Gmail
            </Button>
          }
        />
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivityThinking(): ReactNode {
  // Only thinking: the closed line is the time it took; open, the provider's summary, cut with
  // Show more past 1,200 characters.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        icon={<Sparkles />}
        summary="Thought for 6s"
        className="w-full max-w-xl"
      >
        <MessageActivityNote label="Thinking" ms={6_000}>
          {THINKING}
        </MessageActivityNote>
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivityOneStep(): ReactNode {
  // One step: the closed line names it.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        icon={<Pencil />}
        summary="Updated task TTB-12"
        ms={3_000}
        className="w-full max-w-xl"
      >
        <MessageActivityStep
          icon={<Pencil />}
          verb="Updated"
          target="TTB-12"
          summary="Status → Done"
          ms={3_000}
        />
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivitySubagents(): ReactNode {
  // Subagents nest under the step that started them, each opening on its own steps.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        icon={<Sparkles />}
        summary="Worked for 48s · 2 steps"
        className="w-full max-w-xl"
      >
        <MessageActivityStep
          icon={<Search />}
          verb="Searched tickets"
          target="“open, this week”"
          summary="38 results"
          ms={900}
        />
        <MessageActivityStep
          defaultOpen
          icon={<Users />}
          verb="Ran Subagents"
          summary="4 of 4 done"
          ms={41_000}
        >
          <MessageActivityGroup
            label="Subagents"
            summary="Subagents: 4 of 4 done"
          >
            <MessageActivityStep
              defaultOpen
              icon={<Users />}
              verb="Triaged"
              target="Billing tickets"
              summary="12 tickets"
              ms={18_000}
            >
              <MessageActivityGroup label="Steps">
                <MessageActivityStep
                  icon={<FileText />}
                  verb="Read"
                  target="12 tickets"
                  ms={2_000}
                />
                <MessageActivityStep
                  icon={<Pencil />}
                  verb="Labelled"
                  target="12 tickets"
                  summary="Billing"
                  ms={4_000}
                />
              </MessageActivityGroup>
            </MessageActivityStep>
            <MessageActivityStep
              icon={<Users />}
              verb="Triaged"
              target="Login tickets"
              summary="9 tickets"
              ms={15_000}
            />
            <MessageActivityStep
              icon={<Users />}
              verb="Triaged"
              target="Export tickets"
              summary="11 tickets"
              ms={21_000}
            />
            <MessageActivityStep
              icon={<Users />}
              verb="Triaged"
              target="Other tickets"
              summary="6 tickets"
              ms={12_000}
            />
          </MessageActivityGroup>
        </MessageActivityStep>
      </MessageActivity>
    </Wrapper>
  );
}

export function messagePartsActivityLong(): ReactNode {
  // A 70-step run: the timeline keeps the first 60 and ends with the count of the rest.
  return (
    <Wrapper className="items-start justify-start">
      <MessageActivity
        defaultOpen
        icon={<Sparkles />}
        summary="Worked for 4m · 70 steps"
        omitted={10}
        className="w-full max-w-xl"
      >
        {Array.from({ length: 60 }, (_, index) => (
          <MessageActivityStep
            key={index}
            icon={index % 3 === 0 ? <Mail /> : <Pencil />}
            verb={index % 3 === 0 ? "Drafted reply to" : "Updated"}
            target={`TTB-${100 + index}`}
            ms={600 + ((index * 137) % 2_400)}
          />
        ))}
      </MessageActivity>
    </Wrapper>
  );
}

const THINKING = `${"The person wants every task due before today in Ops moved to Backlog with a note. I'll search Ops for tasks with a due date before today, read the ones that come back to check none is already closed, then move them and add the note. ".repeat(7)}Last, I'll post one summary line.`;

export function messagePartsSourceList(): ReactNode {
  // Closed, then open: numbered rows of icon, title and site, each the link. The last icon
  // failed to load and shows the globe.
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-6">
      <MessageSourceList sources={WEB_SOURCES.slice(0, 3)} />
      <MessageSourceList defaultOpen sources={WEB_SOURCES} />
    </Wrapper>
  );
}

export function messagePartsStreaming(): ReactNode {
  // Mid-answer: `aria-busy` sits on the text alone, so the status beside it is never held back.
  return (
    <Wrapper className="items-start justify-start">
      <Message className="max-w-sm">
        <MessageContent>
          <AgentHeader />
          <MessageStatus>Reading 2 meeting notes…</MessageStatus>
          <p aria-busy>In the 28 Oct review you agreed to keep</p>
        </MessageContent>
      </Message>
    </Wrapper>
  );
}

export function messagePartsSteps(): ReactNode {
  return (
    <Wrapper className="items-start justify-start">
      <MessageSteps
        defaultOpen
        summary="3 steps · Searched the web, 1 failed"
        className="w-full max-w-sm"
      >
        <MessageStep label="Searched the web" meta="4 results" />
        <MessageStep
          status="failed"
          label="Opened acme.com"
          error="The site didn't answer."
        />
        <MessageStep status="running" label="Reading datasheet.pdf…" />
        <MessageStep status="stopped" label="Compared the rates" />
      </MessageSteps>
    </Wrapper>
  );
}

export function messagePartsPlan(): ReactNode {
  return (
    <Wrapper className="items-start justify-start">
      <MessagePlan
        aria-label="Plan"
        className="w-full max-w-sm"
        items={[
          { id: "read", label: "Read the BOQ sheet", state: "done" },
          { id: "first", label: "Match lines 1–9", state: "done" },
          { id: "second", label: "Match lines 10–20", state: "doing" },
          { id: "rate", label: "Fetch the project rates", state: "failed" },
          { id: "check", label: "Check the totals", state: "stopped" },
          { id: "rows", label: "Update the rows", state: "todo" },
        ]}
      />
    </Wrapper>
  );
}

export function messagePartsChanges(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-2">
      <MessageChange
        action={
          <Button size="xs" variant="ghost">
            Undo
          </Button>
        }
      >
        Created task SR-41 Test 3000 K samples
      </MessageChange>
      <MessageChange
        action={
          <Button size="xs" variant="ghost">
            View changes
          </Button>
        }
      >
        12 changes
      </MessageChange>
      <MessageHandoff>Assistant asked BOQ processor</MessageHandoff>
    </Wrapper>
  );
}

export function messagePartsNotice(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-2">
      <MessageNotice
        action={
          <Button size="xs" variant="outline">
            Reply privately
          </Button>
        }
      >
        1 more source is private to you.
      </MessageNotice>
      <MessageStatus
        status="error"
        action={
          <Button size="xs" variant="outline">
            Retry
          </Button>
        }
      >
        The answer stopped partway.
      </MessageStatus>
    </Wrapper>
  );
}

export function messagePartsVersions(): ReactNode {
  function Demo(): ReactNode {
    const [version, setVersion] = useState(2);
    return (
      <MessageVersionSwitch
        current={version}
        total={2}
        previousLabel="Previous answer"
        nextLabel="Next answer"
        label="Answers"
        onPrevious={() => setVersion((value) => value - 1)}
        onNext={() => setVersion((value) => value + 1)}
      />
    );
  }
  return (
    <Wrapper>
      <Demo />
    </Wrapper>
  );
}

export function messagePartsFold(): ReactNode {
  return (
    <Wrapper className="items-start justify-start">
      <MessageFold className="w-full max-w-sm">
        <div className="flex flex-col gap-2 text-sm">
          {Array.from({ length: 16 }, (_, line) => (
            <p key={line}>
              <FileText aria-hidden className="me-1 inline size-3.5" />
              Line {line + 1} of the BOQ matched a 4000 K IP65 downlight.
            </p>
          ))}
        </div>
      </MessageFold>
    </Wrapper>
  );
}

export function messagePartsRecordSources(): ReactNode {
  // Records an answer rests on (meetings, tasks), and the disclaimer for a surface without a
  // composer line to carry it.
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-2">
      <MessageSources>
        <Citation icon={<CalendarDays />} href="#">
          Range review 28 Oct
        </Citation>
        <Citation icon={<SquareCheck />} href="#">
          SR-9 Order 3000 K samples
        </Citation>
      </MessageSources>
      <MessageDisclaimer>Generated by AI · can make mistakes</MessageDisclaimer>
    </Wrapper>
  );
}
