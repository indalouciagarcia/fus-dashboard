import React, { useState } from 'react';
import { usePlayers } from '../../hooks/usePlayers';
import { useStaff } from '../../hooks/useStaff';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/ui/skeleton';

const PeopleManagement: React.FC = () => {
  const { players, isLoading: playersLoading } = usePlayers();
  const { staff, isLoading: staffLoading } = useStaff();
  
  const [view, setView] = useState<'players' | 'staff'>('players');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const isLoading = playersLoading || staffLoading;

  const filteredPlayers = players.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic">People Management</h2>
          <p className="text-muted-foreground text-sm font-medium">Manage {view} database and performance metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 p-1 rounded-xl ring-1 ring-black/5">
            <Button 
                variant={view === 'players' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('players')}
                className="h-9 px-4 text-xs font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Players
            </Button>
            <Button 
                variant={view === 'staff' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('staff')}
                className="h-9 px-4 text-xs font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Staff
            </Button>
          </div>
          <Button className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl">
            <UserPlus className="w-4 h-4" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={`Search ${view}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-secondary/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold uppercase tracking-tight"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2 h-11 px-6 font-bold uppercase tracking-widest text-[10px] rounded-xl">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex bg-secondary/30 p-1 rounded-lg">
            <Button 
                variant={layout === 'grid' ? "white" as any : "ghost"} 
                size="icon" 
                className="h-9 w-9 rounded-md transition-all"
                onClick={() => setLayout('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
             <Button 
                variant={layout === 'list' ? "white" as any : "ghost"} 
                size="icon" 
                className="h-9 w-9 rounded-md transition-all"
                onClick={() => setLayout('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <AnimatePresence mode="wait">
        <motion.div
           key={`${view}-${layout}`}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.3 }}
           className={layout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-3"}
        >
          {view === 'players' ? (
            filteredPlayers.map(player => (
              layout === 'grid' ? (
                <PlayerCard key={player.id} player={player} />
              ) : (
                <PlayerListItem key={player.id} player={player} />
              )
            ))
          ) : (
            filteredStaff.map(person => (
                layout === 'grid' ? (
                  <StaffCard key={person.id} person={person} />
                ) : (
                  <StaffListItem key={person.id} person={person} />
                )
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PlayerCard: React.FC<{ player: any }> = ({ player }) => (
  <Card className="group relative overflow-hidden h-full hover:shadow-xl transition-all duration-500 border-secondary hover:border-primary/20 bg-white rounded-[2rem]">
    <div className="absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all relative">
          <Users className="w-10 h-10 absolute inset-0 m-auto text-primary/20" />
          <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://i.pravatar.cc/300?u=${player.id}`} alt="Player" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-end">
           <span className="text-3xl font-black text-primary opacity-20 group-hover:opacity-100 transition-opacity italic">#{player.number}</span>
           <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest mt-1 bg-white border-primary/20 italic text-primary">{player.position}</Badge>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-black tracking-tighter uppercase italic group-hover:text-primary transition-colors">{player.firstName} <span className="text-foreground">{player.lastName}</span></h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 opacity-60 mt-1">
             <Calendar className="w-3 h-3" /> {new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} Years Old
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-secondary/50">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Foot</p>
            <p className="text-xs font-black uppercase italic">{player.foot}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nationality</p>
            <p className="text-xs font-black uppercase truncate">{player.nationality}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Height</p>
            <p className="text-xs font-black uppercase italic text-foreground opacity-60">{player.height}cm</p>
          </div>
           <div className="space-y-0.5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Weight</p>
            <p className="text-xs font-black uppercase italic text-foreground opacity-60">{player.weight}kg</p>
          </div>
        </div>
      </div>
      
      <button className="absolute bottom-4 right-4 p-2 rounded-lg bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white translate-y-2 group-hover:translate-y-0 shadow-lg shadow-black/5">
        <MoreVertical className="w-4 h-4" />
      </button>
    </CardContent>
  </Card>
);

const PlayerListItem: React.FC<{ player: any }> = ({ player }) => (
  <Card className="p-4 hover:bg-secondary/20 transition-all border-secondary hover:border-primary/20 flex items-center justify-between group rounded-2xl bg-white">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs shadow-sm italic">
         {player.number}
      </div>
      <div>
        <h4 className="font-black text-sm tracking-tight uppercase italic">{player.firstName} {player.lastName}</h4>
        <div className="flex items-center gap-3 mt-0.5 opacity-60">
           <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">{player.position}</span>
           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">• {player.nationality}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden md:flex flex-col items-end">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Age</p>
        <p className="text-sm font-black text-foreground italic">{new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()}Y</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  </Card>
);

const StaffCard: React.FC<{ person: any }> = ({ person }) => (
  <Card className="p-6 border-secondary hover:border-primary/20 hover:shadow-xl transition-all duration-500 bg-white group rounded-[2rem]">
    <div className="flex flex-col items-center text-center space-y-4">
       <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center text-primary shadow-lg border border-white group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
           <img src={(person.photo_url && person.photo_url !== 'null') ? person.photo_url : `https://i.pravatar.cc/300?u=${person.id}`} className="w-full h-full object-cover" />
       </div>
       <div>
          <h4 className="text-lg font-black tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase italic">{person.firstName} {person.lastName}</h4>
          <Badge className="mt-1 font-black uppercase tracking-widest text-[9px] bg-primary/5 text-primary border-primary/10 italic">{person.role}</Badge>
       </div>
       <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-secondary/50">
          <div className="p-2 rounded-xl bg-secondary/30">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Role</p>
            <p className="text-[10px] font-black uppercase italic truncate">{person.role.split(' ')[0]}</p>
          </div>
          <div className="p-2 rounded-xl bg-secondary/30">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Contract</p>
            <p className="text-[10px] font-black uppercase italic">2027</p>
          </div>
       </div>
       <Button variant="outline" className="w-full h-11 font-black text-[10px] uppercase tracking-widest border-secondary hover:border-primary/40 transition-all rounded-xl shadow-sm">
          View Profile
       </Button>
    </div>
  </Card>
);

const StaffListItem: React.FC<{ person: any }> = ({ person }) => (
  <Card className="p-4 hover:bg-secondary/20 transition-all border-secondary hover:border-primary/20 flex items-center justify-between rounded-2xl bg-white">
    <div className="flex items-center gap-4">
       <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <img src={(person.photo_url && person.photo_url !== 'null') ? person.photo_url : `https://i.pravatar.cc/300?u=${person.id}`} className="w-full h-full object-cover rounded-xl" />
       </div>
       <div>
          <h4 className="font-black text-sm uppercase italic tracking-tight">{person.firstName} {person.lastName}</h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 italic">{person.role}</p>
       </div>
    </div>
     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
        <MoreVertical className="w-4 h-4" />
      </Button>
  </Card>
);

export default PeopleManagement;
