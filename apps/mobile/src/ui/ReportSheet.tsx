import { REPORT_REASON_LABELS, type ReportReason } from '@rowle/core';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendReport, type ReportResult } from '../data/report';
import { colors, fontFamily, radius, space } from '../theme';
import { Chip } from './Chip';

const REASONS: ReportReason[] = ['wrong_info', 'cancelled_or_changed', 'suspicious_link', 'fraud', 'image_rights', 'offensive', 'other'];
const MAX = 2000;

const ERRORS: Record<Exclude<ReportResult, 'ok'>, string> = {
  limite: 'Você mandou muitas denúncias seguidas. Tente de novo mais tarde.',
  indisponivel: 'Esse rolê não está mais no Rowlê.',
  erro: 'Não deu para enviar. Confira a conexão e tente de novo.',
};

interface Props {
  visible: boolean;
  eventId: string;
  sessionId?: string;
  onClose: () => void;
}

/** Folha de denúncia: motivo, detalhe opcional e envio anônimo. */
export function ReportSheet({ visible, eventId, sessionId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | ReportResult>('idle');

  const close = () => {
    onClose();
    if (state === 'ok') {
      setReason(null);
      setDetails('');
      setState('idle');
    }
  };
  const send = async () => {
    if (!reason) return;
    setState('sending');
    setState(await sendReport(eventId, sessionId, reason, details));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.dim} onPress={close} accessibilityLabel="Fechar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.grab} />
          {state === 'ok' ? (
            <View accessibilityLiveRegion="polite">
              <Text style={styles.title} accessibilityRole="header">
                Denúncia enviada
              </Text>
              <Text style={styles.text}>A curadoria vai conferir esse rolê.</Text>
              <Pressable onPress={close} accessibilityRole="button" style={styles.send}>
                <Text style={styles.sendText}>Fechar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title} accessibilityRole="header">
                Denunciar rolê
              </Text>
              <Text style={styles.text}>A denúncia é anônima.</Text>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>O que houve?</Text>
                <View style={styles.wrap}>
                  {REASONS.map((r) => (
                    <Chip key={r} label={REPORT_REASON_LABELS[r]} on={reason === r} onPress={() => setReason(r)} />
                  ))}
                </View>
                <Text style={styles.label}>Detalhes</Text>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Conte o que você viu (opcional)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={MAX}
                  style={styles.input}
                  accessibilityLabel="Detalhes da denúncia"
                />
                {state !== 'idle' && state !== 'sending' ? (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {ERRORS[state]}
                  </Text>
                ) : null}
              </ScrollView>
              <Pressable
                onPress={send}
                disabled={!reason || state === 'sending'}
                accessibilityRole="button"
                accessibilityState={{ disabled: !reason || state === 'sending' }}
                style={({ pressed }) => [styles.send, (!reason || state === 'sending') && styles.sendOff, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.sendText, (!reason || state === 'sending') && styles.sendTextOff]}>
                  {state === 'sending' ? 'Enviando…' : reason ? 'Enviar denúncia' : 'Escolha um motivo'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '90%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: space.xl - 4, paddingTop: space.md },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  title: { color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 22 },
  text: { color: colors.textMuted, fontFamily: fontFamily.body, fontSize: 15, marginTop: space.xs },
  label: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: space.xl - 4, marginBottom: space.sm + 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: { minHeight: 96, maxHeight: 160, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: space.md, color: colors.text, fontFamily: fontFamily.body, fontSize: 16, textAlignVertical: 'top' },
  error: { color: colors.danger, fontFamily: fontFamily.bodySemiBold, fontSize: 14, marginTop: space.md },
  send: { height: 54, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: space.lg },
  sendOff: { backgroundColor: colors.surfaceRaised },
  sendText: { color: colors.onBrand, fontFamily: fontFamily.bodyBold, fontSize: 16 },
  sendTextOff: { color: colors.textMuted },
});
