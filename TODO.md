# TODO: Update Dice Roll History with Categories

## Tasks
- [ ] Modify handleRollD20 in CharacterSheet.js to accept a category parameter (default 'ATRIBUTOS')
- [ ] Update dice button in attributes section to pass 'ATRIBUTOS' to handleRollD20
- [ ] Update dice button in combat section to pass 'COMBATE' to handleRollD20
- [ ] Add category field to roll objects in handleRollLuck: 'Atributos e Perícias'
- [ ] Add category field to roll objects in handleRollD20: based on parameter
- [ ] Add category field to roll objects in rollDice: 'Geral'
- [ ] Add category field to roll objects in rollDamageDice: 'Dano'
- [ ] Update DiceHistory component to display dice icon and category mark next to each history item
- [ ] Update DiceRoller.css to style the new dice icon and category elements
- [ ] Test dice rolling in different sections to ensure categories are correctly assigned and displayed
