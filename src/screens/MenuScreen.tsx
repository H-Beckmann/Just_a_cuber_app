import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '../components/TabBar';
import { MAX_NAME_LENGTH, type MyCube } from '../lib/myCubes';
import { useSession } from '../state/session';
import { colors } from '../theme';
import TutorialScreen from './TutorialScreen';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { cubes, addCube, deleteCube, solves } = useSession();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const submit = useCallback(() => {
    const result = addCube(name);
    if (result === 'ok') {
      setName('');
      setError(null);
      return;
    }
    setError(
      result === 'duplicate'
        ? 'Você já tem um cubo com esse nome.'
        : 'Dê um nome ao cubo.',
    );
  }, [addCube, name]);

  const confirmDelete = useCallback(
    (cube: MyCube) => {
      const used = solves.filter(solve => solve.cubeId === cube.id).length;
      Alert.alert(
        `Remover ${cube.name}?`,
        used === 0
          ? 'O cubo sai da lista.'
          : `${used} ${used === 1 ? 'tempo' : 'tempos'} ${
              used === 1 ? 'foi registrado' : 'foram registrados'
            } com ele. Os tempos continuam salvos, só deixam de mostrar o nome.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => deleteCube(cube.id),
          },
        ],
      );
    },
    [deleteCube, solves],
  );

  if (showTutorial) {
    return <TutorialScreen onBack={() => setShowTutorial(false)} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8) + 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        },
      ]}
    >
      <Text style={styles.title}>Menu</Text>

      <Pressable
        onPress={() => setShowTutorial(true)}
        style={({ pressed }) => [styles.entry, pressed && styles.pressed]}
      >
        <View style={styles.entryBody}>
          <Text style={styles.entryTitle}>Como resolver o cubo</Text>
          <Text style={styles.entrySubtitle}>
            Método iniciante, camada por camada, com os algoritmos
          </Text>
        </View>
        <Text style={styles.entryChevron}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Meus cubos</Text>
      <Text style={styles.sectionHint}>
        Ao parar o cronômetro você escolhe com qual deles resolveu.
      </Text>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={text => {
            setName(text);
            setError(null);
          }}
          onSubmitEditing={submit}
          placeholder="Nome do cubo"
          placeholderTextColor={colors.muted}
          maxLength={MAX_NAME_LENGTH}
          returnKeyType="done"
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Text style={styles.addText}>Adicionar</Text>
        </Pressable>
      </View>

      {error !== null && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={cubes}
        keyExtractor={cube => cube.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomSpace }]}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhum cubo cadastrado. Adicione o primeiro acima — o nome é livre,
            como "GAN 356" ou "o azul".
          </Text>
        }
        renderItem={({ item }) => {
          const used = solves.filter(solve => solve.cubeId === item.id).length;
          return (
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.cubeName}>{item.name}</Text>
                <Text style={styles.cubeUses}>
                  {used === 0
                    ? 'sem tempos ainda'
                    : `${used} ${used === 1 ? 'tempo' : 'tempos'}`}
                </Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={8}
                accessibilityLabel={`Remover ${item.name}`}
                style={({ pressed }) => [
                  styles.remove,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.removeText}>Remover</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
  },
  entryBody: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  entrySubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  entryChevron: {
    color: colors.muted,
    fontSize: 22,
    lineHeight: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  add: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  list: {
    paddingTop: 4,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 20,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  cubeName: {
    color: colors.text,
    fontSize: 16,
  },
  cubeUses: {
    color: colors.muted,
    fontSize: 12,
  },
  remove: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  removeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
