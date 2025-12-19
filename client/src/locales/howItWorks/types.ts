export interface HowItWorksUiText {
  title: string;
  prev: string;
  next: string;
}

export interface StepTextContent {
  title: string;
  paragraphs: string[];
  boldTexts?: string[]; // 각 paragraph에서 <strong>으로 감쌀 텍스트들 (순서대로)
  links?: Array<{
    text: string;
    url: string;
  }>;
}

export interface HowItWorksSteps {
  steps: StepTextContent[];
}

