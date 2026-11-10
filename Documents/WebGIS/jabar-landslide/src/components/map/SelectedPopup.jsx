import { Popup } from 'react-leaflet';
import AnomalyDetail from '../detail/AnomalyDetail';
import EventDetail from '../detail/EventDetail';
import QuakeDetail from '../detail/QuakeDetail';

/** Popup info untuk titik terpilih (klik marker atau pilih dari daftar panel). */
export default function SelectedPopup({ selected, data, stability, risk, quakes, onClose }) {
  const { feature, type } = selected;
  const [lng, lat] = feature.geometry.coordinates;

  return (
    <Popup
      key={feature.id}
      position={[lat, lng]}
      maxWidth={400}
      minWidth={320}
      autoPanPadding={[60, 80]}
      className="info-popup"
      eventHandlers={{ remove: () => onClose(feature.id) }}
    >
      <div className="popup-body">
        {type === 'event' && (
          <EventDetail
            feature={feature}
            scenes={data.sentinel[feature.properties.no]}
            stability={stability.byId.get(feature.id)}
            risk={risk.get(feature.id)}
            params={stability.params}
            quakes={quakes}
          />
        )}
        {type === 'anomaly' && (
          <AnomalyDetail
            feature={feature}
            stability={stability.byId.get(feature.id)}
            risk={risk.get(feature.id)}
            params={stability.params}
          />
        )}
        {type === 'quake' && <QuakeDetail feature={feature} events={data.events} />}
      </div>
    </Popup>
  );
}
