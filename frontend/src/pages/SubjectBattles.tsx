import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';
import { Map as MapIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { CharacterCard, WorldMap, BattleArena, LootDrop } from '../components/rpg';
import { mockCharacterStats, mockEquipment, mockSubjectRegions } from '../api/rpg';
import { BossBattle, LootDrop as LootDropType } from '../types/rpg';

const SubjectBattles: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [characterStats, setCharacterStats] = useState(mockCharacterStats);
  const [equipment] = useState(mockEquipment);
  const [regions] = useState(mockSubjectRegions);
  const [currentBattle, setCurrentBattle] = useState<BossBattle | null>(null);
  const [lootDrop, setLootDrop] = useState<LootDropType | null>(null);
  const [showLootModal, setShowLootModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegionClick = (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return;

    if (region.status === 'locked') return;

    setLoading(true);
    setTimeout(() => {
      const mockBattle: BossBattle = {
        id: `battle-${regionId}`,
        bossName: `${region.name} Guardian`,
        bossLevel: characterStats.level + 2,
        bossHealth: 1000,
        bossMaxHealth: 1000,
        currentQuestion: {
          id: 'q1',
          questionText: `What is the derivative of x^2 + 3x + 5?`,
          difficulty: 'medium',
          methods: [
            {
              id: 'm1',
              name: 'Power Rule',
              description: 'Apply the power rule to each term',
              attackType: 'physical',
              manaCost: 30,
              baseDamage: 150,
              correctAnswer: true,
            },
            {
              id: 'm2',
              name: 'Chain Rule',
              description: 'Use the chain rule',
              attackType: 'magic',
              manaCost: 50,
              baseDamage: 80,
              correctAnswer: false,
            },
            {
              id: 'm3',
              name: 'Product Rule',
              description: 'Apply the product rule',
              attackType: 'hybrid',
              manaCost: 40,
              baseDamage: 100,
              correctAnswer: false,
            },
            {
              id: 'm4',
              name: 'Quotient Rule',
              description: 'Use the quotient rule',
              attackType: 'magic',
              manaCost: 45,
              baseDamage: 90,
              correctAnswer: false,
            },
          ],
        },
        turn: 'player',
        playerHealth: characterStats.health,
        playerMana: characterStats.mana,
        battleLog: [],
        isVictory: false,
        isDefeat: false,
      };
      setCurrentBattle(mockBattle);
      setActiveTab(1);
      setLoading(false);
    }, 1000);
  };

  const handleMethodSelect = (methodId: string) => {
    if (!currentBattle || currentBattle.turn !== 'player') return;

    const method = currentBattle.currentQuestion?.methods.find((m) => m.id === methodId);
    if (!method) return;

    const damage = method.correctAnswer ? method.baseDamage : Math.floor(method.baseDamage * 0.5);
    const newBossHealth = Math.max(0, currentBattle.bossHealth - damage);

    const newLog = [
      ...currentBattle.battleLog,
      {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        actor: 'player' as const,
        action: method.name,
        damage,
        xpGained: method.correctAnswer ? 50 : 20,
        message: method.correctAnswer
          ? `Correct! You dealt ${damage} damage with ${method.name}!`
          : `Incorrect. You dealt reduced damage (${damage}).`,
      },
    ];

    if (newBossHealth === 0) {
      const mockLoot: LootDropType = {
        id: 'loot-1',
        items: [
          {
            id: 'item-1',
            name: 'Legendary Math Tome',
            type: 'equipment',
            rarity: 'legendary',
            quantity: 1,
            equipment: {
              id: 'eq-1',
              name: 'Legendary Math Tome',
              type: 'weapon',
              rarity: 'legendary',
              stats: { attack: 100, mana: 50 },
            },
          },
        ],
        xpGained: 500,
        goldGained: 250,
        levelUp: true,
        newLevel: characterStats.level + 1,
      };

      setCurrentBattle({
        ...currentBattle,
        bossHealth: newBossHealth,
        battleLog: newLog,
        isVictory: true,
      });

      setTimeout(() => {
        setLootDrop(mockLoot);
        setShowLootModal(true);
      }, 1500);
    } else {
      const bossDamage = Math.floor(Math.random() * 100) + 50;
      const newPlayerHealth = Math.max(0, currentBattle.playerHealth - bossDamage);

      const bossLog = {
        id: `log-boss-${Date.now()}`,
        timestamp: new Date(),
        actor: 'boss' as const,
        action: 'Boss Attack',
        damage: bossDamage,
        message: `The boss strikes back for ${bossDamage} damage!`,
      };

      setCurrentBattle({
        ...currentBattle,
        bossHealth: newBossHealth,
        playerHealth: newPlayerHealth,
        playerMana: Math.max(0, currentBattle.playerMana - method.manaCost),
        battleLog: [...newLog, bossLog],
        turn: 'player',
        isDefeat: newPlayerHealth === 0,
      });
    }
  };

  const handleLootClose = () => {
    setShowLootModal(false);
    setLootDrop(null);
    setCurrentBattle(null);
    setActiveTab(0);

    if (lootDrop?.levelUp && lootDrop.newLevel) {
      setCharacterStats({
        ...characterStats,
        level: lootDrop.newLevel,
        currentXP: 0,
        xpToNextLevel: characterStats.xpToNextLevel + 1000,
      });
    }
  };

  const handleBackToMap = () => {
    setCurrentBattle(null);
    setActiveTab(0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Subject Battles RPG
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Master subjects by defeating bosses through correct problem-solving methods
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <CharacterCard stats={characterStats} equipment={equipment} playerName="Student Hero" />
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress size={60} />
            </Box>
          ) : currentBattle ? (
            <Box>
              <Box mb={2}>
                <Button startIcon={<BackIcon />} onClick={handleBackToMap} variant="outlined">
                  Back to World Map
                </Button>
              </Box>
              <BattleArena
                battle={currentBattle}
                onMethodSelect={handleMethodSelect}
                playerName="Student Hero"
              />
            </Box>
          ) : (
            <Box>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
              >
                <Tab icon={<MapIcon />} label="World Map" />
              </Tabs>

              {activeTab === 0 && <WorldMap regions={regions} onRegionClick={handleRegionClick} />}
            </Box>
          )}
        </Grid>
      </Grid>

      <LootDrop open={showLootModal} loot={lootDrop} onClose={handleLootClose} />
    </Container>
  );
};

export default SubjectBattles;
