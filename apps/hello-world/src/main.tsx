import { mountIsland } from 'luent'
import './style.css'
import { Counter } from './counter'

mountIsland(() =>(
  <>
    <Counter></Counter>
  </>
), 'luent-island')

