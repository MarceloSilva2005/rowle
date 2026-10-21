import { TERMS_OF_USE } from '@rowle/core';
import { LegalScreen } from '../src/ui/LegalScreen';

export default function Termos() {
  return <LegalScreen doc={TERMS_OF_USE} />;
}
