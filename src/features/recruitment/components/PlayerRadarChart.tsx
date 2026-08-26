import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { CandidateEvaluation } from '../types/recruitment';

interface PlayerRadarChartProps {
  evaluations: {
    name: string;
    color: string;
    eval: CandidateEvaluation;
  }[];
  detailed?: boolean;
  height?: number;
}

export const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({
  evaluations,
  detailed = false,
  height = 360,
}) => {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Aucune évaluation disponible pour afficher le diagramme radar.
      </div>
    );
  }

  let chartData: Array<{ axis: string; fullMark: number; [key: string]: string | number }> = [];

  if (!detailed) {
    // 6 Axes Synthétiques (4 Piliers Fondamentaux + Vitesse & Finition) sur l'échelle 1 à 10
    chartData = [
      {
        axis: '⚽ Technique',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.technical_score || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      {
        axis: '🏃 Physique',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.physical_score || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      {
        axis: '🧭 Tactique',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.tactical_score || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      {
        axis: '🧠 Mental',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.mental_score || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      {
        axis: '⚡ Vitesse Sprint',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.phys_sprint_speed || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      {
        axis: '🎯 Finition',
        fullMark: 10,
        ...evaluations.reduce((acc, curr, idx) => {
          acc[`player_${idx}`] = curr.eval.tech_finishing || 0;
          return acc;
        }, {} as Record<string, number>),
      },
    ];
  } else {
    // Vue détaillée 10 critères clés sur l'échelle 1 à 10
    chartData = [
      { axis: 'Contrôle & Touche', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.tech_first_touch }), {}) },
      { axis: 'Passes', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.tech_passing_short }), {}) },
      { axis: 'Dribble 1v1', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.tech_1v1_attacking }), {}) },
      { axis: 'Accélération', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.phys_acceleration }), {}) },
      { axis: 'Puissance', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.phys_strength }), {}) },
      { axis: 'Endurance', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.phys_endurance }), {}) },
      { axis: 'Placement', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.tact_positioning }), {}) },
      { axis: 'Vision de Jeu', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.tact_awareness }), {}) },
      { axis: 'Combativité / Grinta', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.ment_motivation }), {}) },
      { axis: 'Discipline & Écoute', fullMark: 10, ...evaluations.reduce((acc, curr, i) => ({ ...acc, [`player_${i}`]: curr.eval.ment_coachability }), {}) },
    ];
  }

  return (
    <div style={{ width: '100%', height }} className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#94a3b8', fontSize: 9 }}
            stroke="#cbd5e1"
          />
          {evaluations.map((item, idx) => (
            <Radar
              key={`radar-${idx}`}
              name={item.name}
              dataKey={`player_${idx}`}
              stroke={item.color}
              fill={item.color}
              fillOpacity={evaluations.length > 1 ? 0.25 : 0.4}
              strokeWidth={2.5}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              padding: '8px 12px',
            }}
          />
          {evaluations.length > 1 && <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default PlayerRadarChart;
